#!/usr/bin/env node
//import * as vite from "@vite/vitejs"
//import WS_RPC from "@vite/vitejs-ws"
// Temporarily use vitejs-notthomiz for fixed memory leaks issue 

import { Hex } from "./type"
import { PoWDifficultyResult, QuotaInfo } from "./viteTypes"

// until Vite approves his PR
const vite = require("vitejs-notthomiz")
const HTTP_RPC = require("vitejs-notthomiz-http").default
const WS_RPC = require("vitejs-notthomiz-ws").default
const config = require("./config.json")
const BigNumber = require("bignumber.js").default

// Usage: ./send_vite destination amount
const [,,destination, amountString] = process.argv

// Validate address
if(!vite.wallet.isValidAddress(destination)){
    throw new Error("Invalid Address")
}
// Validate amount
if(!/^\d+(\.\d+)?$/.test(amountString)){
    throw new Error("Invalid Amount")
}
const amount = parseInt(amountString);

console.log("Attempting to send " + amount + " to " + destination);

// Grab RPC URL and timeout from config.json
const url = new URL(config.VITE_NODE);
const timeout = parseInt(config.timeout);
const tokenID = config.token_id;

console.log("Using " + url + " with timeout of " + timeout + " ms");

// Set up either WS_RPC or HTTP_RPC
const provider = /^wss?:$/.test(url.protocol) ?
    // Websocket
    new WS_RPC(config.VITE_NODE, timeout, {
        protocol: "",
        headers: "",
        clientConfig: "",
        retryTimes: Infinity,
        retryInterval: 10000
    }) : /^https?:$/.test(url.protocol) ? 
    // HTTP
    new HTTP_RPC(config.VITE_NODE, timeout) :
    // Invalid RPC URL format
    new Error("Invalid node url: " + config.VITE_NODE)
if(provider instanceof Error) throw provider

// Set up ViteAPI
const ViteAPI = new vite.ViteAPI(provider,  () => {
        console.log('Vite client successfully connected: ');
});
let seed : Hex = config.seed;
let index = config.index;
console.log("Using address from seed \"" + seed + "\" index " + index);
//const keyPair = vite.wallet.deriveKeyPairByIndex(seed, index);
const keyPair = vite.wallet.deriveKeyPairByPath(seed, "m/44'/666666'/0'");
const publicKey = keyPair.publicKey;
const privateKey = keyPair.privateKey;
const address = vite.wallet.createAddressByPrivateKey(privateKey);
console.log("Address: " + address.address + " Private key: " + privateKey);

const sendVite = async (destination : string, tokenId: string, amount : number) => {
    // Validate inputs
    if(!vite.wallet.isValidAddress(destination)) {
        console.log("Invalid destination address \"" + destination + "\"");
        throw new Error("Invalid destination address");
    }
    if(!vite.utils.isValidTokenId(tokenId)) {
        console.log("Invalid token ID \"" + tokenId + "\"");
        throw new Error("Invalid token ID");
    }
    if(amount < 0) {
        console.log("Amount must be greater than 0");
        throw new Error("Amount must be greater than 0");
    }
    // Check that we have enough money
    const balances = (await ViteAPI.request("ledger_getAccountInfoByAddress", address.address))?.balanceInfoMap || {}
    const balance = new BigNumber(balances[tokenId]?.balance || "0")
    if(balance.isLessThan(amount)) {
        let errorMsg = "Insufficient balance. Requested: " + amount + " Available: " + balance;
        console.log(errorMsg);
        throw new Error(errorMsg);
    }
    try {
        // Set up account block
        const accountBlock = vite.accountBlock.createAccountBlock("send", {
            toAddress: destination,
            address: address.address,
            tokenId: tokenId,
            amount: amount.toString()
        });
        accountBlock.setProvider(ViteAPI)
        .setPrivateKey(address.privateKey);
        accountBlock.autoSetPreviousAccountBlock();
        // Grab quota associated with this account
        const quotaInfo : QuotaInfo = await ViteAPI.request('contract_getQuotaByAccount', address.address).catch(error => {
            let errorMsg = "Error while getting quota by account : " + error.message;
            console.log(errorMsg);
            return;
        })
        // Calculate the required difficulty for this transaction
        const difficulty : PoWDifficultyResult = ViteAPI.request("ledger_getPoWDifficulty", {
            address: accountBlock.address,
            previousHash: accountBlock.previousHash,
            blockType: accountBlock.blockType,
            toAddress: accountBlock.toAddress,
            data: accountBlock.data
        })
        const availableQuota = new BigNumber(quotaInfo.currentQuota)
        // If not enough quota available
        if(availableQuota.isLessThan(difficulty.requiredQuota)){
            console.log("Filling in PoW");
            // Fill PoW 
            await accountBlock.PoW(difficulty.difficulty)
        }
        // Sign the account block
        await accountBlock.sign()
   
        // Attempt to send
        const hash = (await accountBlock.send()).hash

        return {
            hash: hash,
            from: address.address,
            to: destination,
            tokenid: tokenId,
            amount: amount
        }

    } catch(err) {
        console.error(err)
        process.exit(1)
    }
}

try{
    sendVite(destination, tokenID, amount).then(function(result) {
        console.log("Sent " + amount + " vite from " + destination + " to " + address.address);
        console.log("Result: " + result.hash);
    }).catch(error => {
        let errorMsg = "Error while sending vite : " + error.message;
        console.log(errorMsg);
        return;
    })
} catch(err) {
    console.error(err)
    process.exit(1)
}
