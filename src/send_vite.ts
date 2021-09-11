// Usage: $ generateNewWallet [number-of-addresses]
// Generates a new wallet and either 5 or number-of-addresses addresses
// And outputs information 

// Import wallet module from vitejs
// Wallet reference: https://docs.vite.org/vitej/modules/wallet.html#wallet
import { HTTP_RPC } from '@vite/vitejs-http';
import {ViteAPI, wallet, accountBlock} from '@vite/vitejs';
import { AddressObj, BlockType } from '@vite/vitejs/distSrc/accountBlock/type';
import { Address } from './type';
import {getLogger} from './logs';

const logger = getLogger();

const { createAccountBlock, utils } = accountBlock;


interface Receiver {
    address: Address;
    amount: BigInt;
}

// Grab data from .env
require('dotenv').config();

// Grab files from .env
const RPC_NET = process.env.RPC_NET;
const MNEMONICS = process.env.MNEMONICS;

// Initialize ViteClient
const httpProvider = new HTTP_RPC(RPC_NET);
const vclient = new ViteAPI(httpProvider, () => {
	console.log('Vite client successfully connected: ');
});

const sendAccount: AddressObj = wallet.getWallet(MNEMONICS).deriveAddress(0);

// Usage: send_vite.ts [toAddress] [amount]
const toAddress = process.argv[2];
const amt = BigInt(process.argv[3]);

const sendLoopInterval = 20 * 1000;

// Send transaction 
const sendTransaction = async (address: Address, amount: BigInt) => {
    // Create send account block for amount to sendAccount.address
    const ab = createAccountBlock('send', {
        address: sendAccount.address,
        toAddress: address,
        amount,
    })
    .setProvider(vclient)
    .setPrivateKey(sendAccount.privateKey);
    // Link to previous block
    await ab.autoSetPreviousAccountBlock();
    // Send transaction with PoW
    return ab.sendByPoW();
};

const logFailedTransactionRetry = ({amount, address}: Receiver, attempt: number, maxAttempts: number) => (
    reason: any
) => {
    logger.info(
        `[${attempt}/${maxAttempts}] Could not send ${amount} to ${address}.
    )}. Waiting and retrying.`,
        reason
    );
};

const handleTransactionFailed = ({amount, address}: Receiver) => (err: any) => {
    logger.error(`Failed to send ${amount} to ${address} after retries`, err);
};

const handleTransactionSuccess = ({amount, address}: Receiver) => () => {
    logger.info(`Successfully sent ${amount} to ${address}.`);
};

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
const retryOperation = (operation: () => Promise<unknown>, receiver: Receiver, attemptCounter: number) => {
    return new Promise((resolve, reject) => {
        return operation()
            .then(resolve)
            .catch(reason => {
                if (attemptCounter > 0) {
                    const attemptNumber = 4 - attemptCounter;
                    logFailedTransactionRetry(receiver, attemptNumber, 3)(reason);
                    return wait(sendLoopInterval)
                        .then(retryOperation.bind(null, operation, receiver, attemptCounter - 1))
                        .then(resolve)
                        .catch(reject);
                }
                return reject(reason);
            });
    });
};

const attemptSendToReceiver = async (receiver: Receiver) => {
    const maxRetries = 3;
    const {address, amount} = receiver;
    await retryOperation(() => sendTransaction
(address, amount), receiver, maxRetries)
        .then(handleTransactionSuccess(receiver))
        .catch(handleTransactionFailed(receiver));
};

const mainLoop = async () => {
    console.log("Sending " + amt + " to " + toAddress);
    await sendTransaction(toAddress, amt).then(handleTransactionSuccess, handleTransactionFailed );
};

mainLoop();

export async function sendVITE(seed: string, toAddress: string, amount: string, tokenId: string):Promise<string>{
    const keyPair = vite.wallet.deriveKeyPairByIndex(seed, 0)
    const fromAddress = vite.wallet.createAddressByPrivateKey(keyPair.privateKey)

    const accountBlock = vite.accountBlock.createAccountBlock("send", {
        toAddress: toAddress,
        address: fromAddress.address,
        tokenId: tokenId,
        amount: amount
    })
    accountBlock.setProvider(wsProvider)
    .setPrivateKey(keyPair.privateKey)
    const [
        quota,
        difficulty
    ] = await Promise.all([
        wsProvider.request("contract_getQuotaByAccount", fromAddress.address),
        accountBlock.autoSetPreviousAccountBlock()
        .then(() => wsProvider.request("ledger_getPoWDifficulty", {
            address: accountBlock.address,
            previousHash: accountBlock.previousHash,
            blockType: accountBlock.blockType,
            toAddress: accountBlock.toAddress,
            data: accountBlock.data
        })) as Promise<{
            requiredQuota: string;
            difficulty: string;
            qc: string;
            isCongestion: boolean;
        }>
    ])
    const availableQuota = new BigNumber(quota.currentQuota)
    if(availableQuota.isLessThan(difficulty.requiredQuota)){
        await accountBlock.PoW(difficulty.difficulty)
    }
    await accountBlock.sign()
    
    return (await accountBlock.send()).hash
}
