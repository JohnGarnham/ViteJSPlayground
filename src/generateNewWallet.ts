// Import wallet module from vitejs
// Wallet reference: https://docs.vite.org/vitej/modules/wallet.html#wallet
import {wallet} from '@vite/vitejs';

// Generate a brand new wallet
console.log("Generating New Wallet")
const myWallet = wallet.createWallet();
console.log('RootPath: ', myWallet.rootPath);
console.log('Mnemonics: ', myWallet.mnemonics);
console.log('Entropy: ', myWallet.entropy);
console.log('Seed Hex: ', myWallet.seedHex);
console.log('ID: ', myWallet.id);

// Derive an address
const addressObj = myWallet.deriveAddress(0);
console.log('\nAddress: ', addressObj.address);
console.log('Original Address: ', addressObj.originalAddress);
console.log('Private Key: ', addressObj.privateKey);
console.log('Public Key: ', addressObj.publicKey);
console.log('Path: ', addressObj.path);
