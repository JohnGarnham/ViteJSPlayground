
import { BlockType, Base64, Hex, TokenId, AccountBlockType, Uint8 } from './type';

import {HTTP_RPC} from '@vite/vitejs-http';
import {ViteAPI, wallet, accountBlock} from '@vite/vitejs';
import {Address, BigInt, AddressObj} from '@vite/vitejs/distSrc/accountBlock/type';
import {Int64, Uint64, RPCResponse} from '@vite/vitejs/distSrc/utils/type';
import {getLatestCycleTimestampFromNow} from './timeUtil';
import {getLogger} from './logs';

export const Default_Hash = '0000000000000000000000000000000000000000000000000000000000000000'; // A total of 64 0

const BigNumber = require('bn.js');

export function getHeightHex(height: Uint64): Hex {
    return height ? Buffer.from(new BigNumber(height).toArray('big', 8)).toString('hex') : '';
}

export function getBlockTypeHex(blockType: BlockType): Hex {
    return Buffer.from([blockType]).toString('hex');
}

export function getPreviousHashHex(previousHash: Hex): Hex {
    return previousHash || Default_Hash;
}

export function getAccountBlockHash(accountBlock: {
    blockType: BlockType;
    address: Address;
    hash?: Hex;
    height?: Uint64;
    previousHash?: Hex;
    fromAddress?: Address;
    toAddress?: Address;
    sendBlockHash?: Hex;
    tokenId?: TokenId;
    amount?: BigInt;
    fee?: BigInt;
    data?: Base64;
    difficulty?: BigInt;
    nonce?: Base64;
    vmlogHash?: Hex;
    triggeredSendBlockList?: AccountBlockType[];
}): Hex {
    let source = '';

    source += getBlockTypeHex(accountBlock.blockType);
    source += getPreviousHashHex(accountBlock.previousHash);

    source += Buffer.from([accountBlock.blockType]).toString('hex')
    source += accountBlock.previousHash

  
    source += getHeightHex(accountBlock.height);
    source += getAddressHex(accountBlock.address);

    if (isRequestBlock(accountBlock.blockType)) {
        source += getAddressHex(accountBlock.toAddress);
        source += getAmountHex(accountBlock.amount);
        source += getTokenIdHex(accountBlock.tokenId);
    } else {
        source += getSendBlockHashHex(accountBlock.sendBlockHash);
    }

    source += getDataHex(accountBlock.data);
    source += getFeeHex(accountBlock.fee);
    source += accountBlock.vmlogHash || '';
    source += getNonceHex(accountBlock.nonce);
    source += getTriggeredSendBlockListHex(accountBlock.triggeredSendBlockList);

    const sourceHex = Buffer.from(source, 'hex');
    const hashBuffer = blake.blake2b(sourceHex, null, 32);
    return Buffer.from(hashBuffer).toString('hex');
}


let height = "200"
console.log('Height = ' + height);
console.log('getHeightHex = ' + getHeightHex(height));
height = "2400"
console.log('Height = ' + height);
console.log('getHeightHex = ' + getHeightHex(height));
height = "5000"
console.log('Height = ' + height);
console.log('getHeightHex = ' + getHeightHex(height));
