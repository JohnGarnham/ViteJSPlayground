// Usage: $ generateNewWallet [number-of-addresses]
// Generates a new wallet and either 5 or number-of-addresses addresses
// And outputs information 

// Import wallet module from vitejs
// Wallet reference: https://docs.vite.org/vitej/modules/wallet.html#wallet
import { HTTP_RPC } from '@vite/vitejs-http';
import {ViteAPI, wallet, accountBlock} from '@vite/vitejs';
import { AddressObj, BlockType } from '@vite/vitejs/distSrc/accountBlock/type';

const { createAccountBlock, utils } = accountBlock;

// Grab data from .env
require('dotenv').config();

// Grab files from .env
const RPC_NET = process.env.RPC_NET;
const MNEMONICS = process.env.MNEMONICS;

// Initialize ViteClient
const httpProvider = new HTTP_RPC(RPC_NET);
const viteClient = new ViteAPI(httpProvider, () => {
	console.log('Vite client successfully connected: ');
});

const sendAccount: AddressObj = wallet.getWallet(MNEMONICS).deriveAddress(0);

const prompt = require("prompt-sync")({ sigint: true });

const toAddress = prompt("Enter toAddress:",sendAccount.address);
const amount = prompt("Enter amount:",500);

const ab = createAccountBlock('send', {
    address: sendAccount.address,
    toAddress: toAddress,
    amount,
})
.setProvider(viteClient)
.setPrivateKey(sendAccount.privateKey);

var accountBlockHash = utils.getAccountBlockHash(ab)
console.log("Account block hash: " + accountBlockHash)
