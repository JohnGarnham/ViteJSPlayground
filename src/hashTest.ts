
import { BlockType, Base64, Hex, TokenId, AccountBlockType, Uint8 } from './type';

import { isValidAddress, getAddressFromPublicKey, createAddressByPrivateKey, getOriginalAddressFromAddress, AddressType, getAddressFromOriginalAddress } from '@vite/vitejs-wallet/address';
import { checkParams, isNonNegativeInteger, isHexString, isValidTokenId, getOriginalTokenIdFromTokenId, isObject, ed25519, isBase64String } from '@vite/vitejs-utils';

import {HTTP_RPC} from '@vite/vitejs-http';
import {ViteAPI, wallet, accountBlock} from '@vite/vitejs';
import {Address, BigInt, AddressObj} from '@vite/vitejs/distSrc/accountBlock/type';
import {Int64, Uint64, RPCResponse} from '@vite/vitejs/distSrc/utils/type';
import {getLatestCycleTimestampFromNow} from './timeUtil';
import {getLogger} from './logs';

const blake = require('blakejs/blake2b');

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

export function getAddressHex(address: Address): Hex {
    return address ? getOriginalAddressFromAddress(address) : '';
}

export function getToAddressHex(toAddress: Address): Hex {
    return toAddress ? getOriginalAddressFromAddress(toAddress) : '';
}

function leftPadBytes(bytesData, len) {
    if (bytesData && len - bytesData.length < 0) {
        return bytesData.toString('hex');
    }

    const result = new Uint8Array(len);
    if (bytesData) {
        result.set(bytesData, len - bytesData.length);
    }
    return Buffer.from(result).toString('hex');
}

export function isRequestBlock(blockType: BlockType): Boolean {
    return blockType === BlockType.CreateContractRequest
        || blockType === BlockType.TransferRequest
        || blockType === BlockType.RefundByContractRequest
        || blockType === BlockType.ReIssueRequest;
}

export function isResponseBlock(blockType: BlockType): Boolean {
    return blockType === BlockType.Response
        || blockType === BlockType.ResponseFail
        || blockType === BlockType.GenesisResponse;
}

function getNumberHex(amount) {
    const bigAmount = new BigNumber(amount);
    const amountBytes = amount && !bigAmount.isZero() ? bigAmount.toArray('big') : '';
    return leftPadBytes(amountBytes, 32);
}

export function getAmountHex(amount): Hex {
    return getNumberHex(amount);
}


export function getTokenIdHex(tokenId: TokenId): Hex {
    return tokenId ? getOriginalTokenIdFromTokenId(tokenId) || '' : '';
}

export function getSendBlockHashHex(sendBlockHash: Hex): Hex {
    return sendBlockHash || Default_Hash;
}

export function getDataHex(data: Base64): Hex {
    return data ? blake.blake2bHex(Buffer.from(data, 'base64'), null, 32) : '';
}

export function getFeeHex(fee: BigInt): Hex {
    return getNumberHex(fee);
}

export function getNonceHex(nonce: Base64) {
    const nonceBytes = nonce ? Buffer.from(nonce, 'base64') : '';
    return leftPadBytes(nonceBytes, 8);
}

export function getTriggeredSendBlockListHex(triggeredSendBlockList: AccountBlockType[] = []) {
    if (!triggeredSendBlockList) {
        return '';
    }
    let source = '';
    triggeredSendBlockList.forEach(block => {
        source += block.hash;
    });
    return source;
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
