import { HTTP_RPC } from '@vite/vitejs-http';
import {ViteAPI} from '@vite/vitejs';
import { QuotaInfo, quotaToUT } from './viteTypes'
import * as vite from "@vite/vitejs"

var path = require('path');

// Grab data from .env
require('dotenv').config();

// Grab files from .env
var RPC_NET = process.env.MAINNET;

// Use contract_getQuotaByAccount call to get quota info for specified address
const getQuotaDetails = async (address : string) => {
    const quotaInfo : QuotaInfo = await viteClient.request('contract_getQuotaByAccount', address);
    console.log("Current Quota: " + quotaToUT(quotaInfo.currentQuota));
    console.log("Max Quota: " + quotaToUT(quotaInfo.maxQuota));
    console.log("Stake Amount: " + quotaInfo.stakeAmount);
}

// Check argument count
if(process.argv.length != 3 && process.argv.length != 4) {
    console.log("Usage: " + path.basename(process.argv[1]) + " address [MAINNET | TESTNET]");
    process.exit();
}

// Grab address 
var address = process.argv[2];
// Validate address
if(!vite.wallet.isValidAddress(address)){
    console.log("Invalid vite address \"" + address + "\"");
    process.exit();
}

// Grab option mode value
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
