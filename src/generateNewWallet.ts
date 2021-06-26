// Usage: $ generateNewWallet [number-of-addresses]
// Generates a new wallet and either 5 or number-of-addresses addresses
// And outputs information 

// Import wallet module from vitejs
// Wallet reference: https://docs.vite.org/vitej/modules/wallet.html#wallet
import {wallet} from '@vite/vitejs';

// Generate a brand new wallet
var examples = 5;
if(process.argv[2] != undefined) {
    examples = parseInt(process.argv[2]);
}
console.log("Examples: ", examples);
console.log("Generating New Wallet and ")
const myWallet = wallet.createWallet();
console.log('RootPath: ', myWallet.rootPath);
console.log('Mnemonics: ', myWallet.mnemonics);
console.log('Entropy: ', myWallet.entropy);
console.log('Seed Hex: ', myWallet.seedHex);
console.log('ID: ', myWallet.id);

// Derive an address
for(var i = 0; i < examples; i++) {
    const addressObj = myWallet.deriveAddress(i);
    console.log('\nPath: ', addressObj.path);
    console.log('Address: ', addressObj.address);
    console.log('Original Address: ', addressObj.originalAddress);
    console.log('Private Key: ', addressObj.privateKey);
    console.log('Public Key: ', addressObj.publicKey);
}