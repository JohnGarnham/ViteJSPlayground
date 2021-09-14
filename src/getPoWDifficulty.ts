
import { HTTP_RPC } from '@vite/vitejs-http';
import {ViteAPI} from '@vite/vitejs';
import { printBlockType, QuotaInfo, quotaToUT } from './viteTypes'
import * as vite from "@vite/vitejs"
import { AccountBlock } from '@vite/vitejs/distSrc/accountblock/accountBlock';
import { BlockType } from '@vite/vitejs/distSrc/utils/type';

var path = require('path');

// Grab data from .env
require('dotenv').config();

// Grab files from .env
var RPC_NET = process.env.MAINNET;

// Check argument count
if(process.argv.length != 5 && process.argv.length != 6) {
    console.log("Usage: " + path.basename(process.argv[1]) + " fromAddress toAddress blockType [data]");
    process.exit();
}

// Grab and validate fromAddress and toAddress
const fromAddress = process.argv[2];
const toAddress = process.argv[3];
// Validate from address
if(!vite.wallet.isValidAddress(fromAddress)){
    console.log("Invalid vite address \"" + fromAddress + "\"");
    process.exit();
}
// Validate to address
if(!vite.wallet.isValidAddress(toAddress)){
    console.log("Invalid vite address \"" + toAddress + "\"");
    process.exit();
}

// Grab blockType
const blockType = parseInt(process.argv[4]);
// Validate block type
if(blockType < 1 || blockType > 7) {
    console.log("Invalid block type \"" + blockType + "\"");
    process.exit();
}

// Grab data
var data = "";
if(process.argv.length == 6) {
    data = process.argv[5]
}

console.log("Looking up required quota for a transaction from \"" + fromAddress + "\" to \"" + toAddress + "\"" +
    " block type " + printBlockType(blockType) + " data: \"" + data + "\"");

// Initialize ViteClient
const httpProvider = new HTTP_RPC(RPC_NET);
const viteClient = new ViteAPI(httpProvider, () => {
});

getPoWDifficultyForResponse(fromAddress, toAddress, blockType, data);

async function getPoWDifficultyForResponse(fromAddress, toAddress, blockType, data) {
    try {

        let result = getCurrentHeightAndPreviousHash(fromAddress);
        const previousHash = (await result).previousHash;
        const powDifficulty = await viteClient.request('ledger_getPoWDifficulty', {
            "address": fromAddress,
            "previousHash": previousHash,
            "blockType": blockType,
            "toAddress" : toAddress,
            "data" : data
        })

        let quotaUT = quotaToUT(powDifficulty.requiredQuota);
        console.log("Required Quota: " + quotaUT + " UT (" + powDifficulty.requiredQuota + ")");
        console.log("Difficulty: " + powDifficulty.difficulty);
        console.log("QC: " + powDifficulty.qc);
        console.log("isCongestion: " + powDifficulty.isCongestion);

    } catch(err) {
        console.log("Error getting PoW difficulty: " + err);
        throw err;
    }
}

async function getCurrentHeightAndPreviousHash(accountAddress) {
        const latestAccountBlock = await viteClient.request('ledger_getLatestAccountBlock', accountAddress);
        let previousHash = "0000000000000000000000000000000000000000000000000000000000000000";
        let height = 1;

        if (latestAccountBlock) {
            height = Number(latestAccountBlock.height) + 1;
            previousHash = latestAccountBlock.hash;
        }
    
        let result = {
            "height": height,
            "previousHash": previousHash
        }
    
        return result;
  }