// Usage: $ generateNewWallet [number-of-addresses]
// Generates a new wallet and either 5 or number-of-addresses addresses
// And outputs information 

// Import wallet module from vitejs
// Wallet reference: https://docs.vite.org/vitej/modules/wallet.html#wallet
import { HTTP_RPC } from '@vite/vitejs-http';
import {ViteAPI, accountBlock} from '@vite/vitejs';
import { RPCResponse } from '@vite/vitejs/distSrc/utils/type';
import { QuotaInfo, quotaToUT } from './viteTypes'


const { createAccountBlock, utils } = accountBlock;

// Grab data from .env
require('dotenv').config();

// Grab files from .env
var RPC_NET = process.env.MAINNET;


const getQuotaDetails = async (address : string) => {
    const quotaInfo : QuotaInfo = await viteClient.request('contract_getQuotaByAccount', address);
    console.log("Current Quota: " + quotaToUT(quotaInfo.currentQuota));
    console.log("Max Quota: " + quotaToUT(quotaInfo.maxQuota));
    console.log("Stake Amount: " + quotaInfo.stakeAmount);
}

// Check argument count
if(process.argv.length != 3 && process.argv.length != 4) {
    console.log("Usage: " + process.argv[1] + " address [MAINNET | TESTNET]");
    process.exit();
}

// Grab address
var address = process.argv[2];
var mode = "MAINNET";
if(process.argv.length == 4) {
    mode = process.argv[3];
    if(mode == "TESTNET") {
        RPC_NET = process.env.TESTNET;
    } else if(mode == "MAINNET") {
        RPC_NET = process.env.MAINNET;
    } else {
        console.log("Invalid network. Please choose MAINNET or TESTNET");
        process.exit();
    }
}

// Initialize ViteClient
const httpProvider = new HTTP_RPC(RPC_NET);
const viteClient = new ViteAPI(httpProvider, () => {
	console.log('Vite client successfully connected: ');
});

console.log("Looking up quota for address: \"" + address + "\" on " + mode);
console.log("Using " + RPC_NET);
// Display quota info
getQuotaDetails(address);
