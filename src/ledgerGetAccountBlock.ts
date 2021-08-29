import { HTTP_RPC } from '@vite/vitejs-http';
import { ViteAPI } from '@vite/vitejs';
import { AccountBlockType, Hex, Uint8, Uint16, Int64, Uint64, TokenId, TokenInfo, Base64, 
    BlockType, RPCResponse } from '@vite/vitejs/distSrc/utils/type';
import {getLatestCycleTimestampFromNow, getYYMMDD} from './timeUtil';
import { AccountBlock, SBPVoteDetail, RewardByDayInfo, Receiver, rawToVite } from './viteTypes'
import { AccountBlockStatus } from '@vite/vitejs/distSrc/accountBlock/utils';

// Grab data from .env
require('dotenv').config();

// Grab files from .env
const RPC_NET = process.env.RPC_NET || 'ws://localhost:23457';
const SBP_NAME = process.env.SBP_NAME || 'ViNo_Community_Node';

// Initialize ViteClient
const httpProvider = new HTTP_RPC(RPC_NET);
const viteClient = new ViteAPI(httpProvider, () => {
	console.log('Vite client successfully connected: ');
});

let accountBlocks : AccountBlockType[];

const getLedgerByAddress = async (account: string, hash?: string, tti?: string, blocks?: number) => {
    if(hash == "0") hash = null;
    if(tti == "0") tti = null;
    const ledger : AccountBlockType = await viteClient.request('ledger_getAccountBlocks', account, hash, tti, blocks);
    return ledger;
}

const getLedgerByBlockHeight = async (height: string) => {
    const ledger : AccountBlockType[] = await viteClient.request('ledger_getAccountBlockByHeight', height);
    return ledger;
}

const showLedgerDetails = async (accountNumber: string, hash?: string, tti? :string, blocks? : number) => {

    let ledgerInfo: AccountBlockType;

    // Get ledger info for specified address
    ledgerInfo = await getLedgerByAddress(accountNumber, hash, tti, blocks).catch((res: RPCResponse) => {
        console.log(`Could not retrieve ledger for ${accountNumber}}`, res);
        throw res.error;
    });

    console.log(ledgerInfo);

}

// User can pass in optional cycle number
const accountLookup = process.argv[2];
const hash = process.argv[3];
const tti = process.argv[4];
const numBlocks = process.argv[5];
let blocks = 0;

console.log("Looking up ledger for account: " + accountLookup);
if(hash != undefined) console.log("Hash: " + hash);
if(tti != undefined) console.log("TTI: " + tti);
if(numBlocks != undefined) {
    console.log("Num blocks: " + numBlocks);
    blocks = parseInt(numBlocks);
}

showLedgerDetails(accountLookup,hash,tti,blocks)
.catch(error => {
	console.error("Error while grabbing ledger information:" + error.message);
});