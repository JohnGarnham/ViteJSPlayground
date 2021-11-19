import {wallet} from '@vite/vitejs';
const vite = require("vitejs-notthomiz")

// Check argument count
if(process.argv.length != 4) {
    console.log("Usage: " + process.argv[1] + " seed index");
    process.exit();
}

// Usage: ./send_vite destination amount
const [,,seed,path] = process.argv;

console.log("Attemping to derive key pair from path \"" + seed + "\" path " + path);

const keyPair = vite.wallet.deriveKeyPairByPath(seed, path);

const publicKey = keyPair.publicKey;
const privateKey = keyPair.privateKey;

console.log("\nOutput from vite.wallet.derivateKeyPairByPath(\"" + seed + "\", " + path + ") :");
console.log("Public key: " + publicKey);
console.log("Private key: " + privateKey);

const address = vite.wallet.createAddressByPrivateKey(privateKey);

console.log("\nOutput from vite.wallet.createAddressByPrivateKey(\"" + privateKey + "\") :");
console.log("Address: " + address.address);
console.log("Original Address: " + address.originalAddress);
console.log("Public Key: " + address.publicKey);
console.log("Private Key: " + address.privateKey);
console.log("Address: " + address.address);

const address2 = vite.wallet.getAddressFromPublicKey(publicKey);

console.log("\nOutput from vite.wallet.getAddressFromPublicKey(\"" + publicKey + "\") :");
console.log("Address: " + address2);

const originalAddress = vite.wallet.getOriginalAddressFromAddress(address2);

console.log("\nOutput from vite.wallet.getOriginalAddressFromAddress(\"" + address2 + "\") :");
console.log("Original Address: " + originalAddress);

const address3 = vite.wallet.getAddressFromOriginalAddress(originalAddress);

console.log("\nOutput from vite.wallet.getAddressFromOriginalAddress(\"" + originalAddress + "\") :");
console.log("Address: " + address3);