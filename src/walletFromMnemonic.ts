// Usage: $ walletFromMnemonics
// Generates a wallet from the input mnemonics
// And outputs information 

// Import wallet module from vitejs
// Wallet reference: https://docs.vite.org/vitej/modules/wallet.html#wallet
import {wallet} from '@vite/vitejs';

require('dotenv').config();

//const mnemonics = "sister void search obey stomach situate surface dad doll million animal crash" +
//    "special six find forget second fat group belt human whip improve topic";
//const mnemonics = process.env.MNEMONICS;
const mnemonics = "sister void search obey stomach situate surface dad doll million animal crash special six find " +
    "forget second fat group belt human whip improve topic";

// Derive wallet from mnemonics phrases
const myWallet = wallet.getWallet(mnemonics);

// Output wallet information
console.log('RootPath: ', myWallet.rootPath);
console.log('Mnemonics: ', myWallet.mnemonics);
console.log('Entropy: ', myWallet.entropy);
console.log('Seed Hex: ', myWallet.seedHex);
console.log('ID: ', myWallet.id);

// Output 5 addresses
for(var i = 0; i < 5; i++) {
    const addressObj = myWallet.deriveAddress(i);
    console.log('\nPath: ', addressObj.path);
    console.log('Address: ', addressObj.address);
    console.log('Original Address: ', addressObj.originalAddress);
    console.log('Private Key: ', addressObj.privateKey);
    console.log('Public Key: ', addressObj.publicKey);
}