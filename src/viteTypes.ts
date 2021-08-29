import { Hex, Uint8, Uint16, Int64, Uint64, TokenId, TokenInfo, Base64, BlockType, RPCResponse } from '@vite/vitejs/distSrc/utils/type';
import { Address, BigInt, AddressObj } from '@vite/vitejs/distSrc/accountBlock/type';

export interface AccountBlock {
    blockType: BlockType;
    height: Uint64;
    hash: Hex;
    previousHash: Hex;
    address: Address;
    publicKey: Base64;
    producer?: Address;
    fromAddress?: Address;
    toAddress: Address;
    sendBlockHash?: Hex;
    tokenId?: TokenId;
    amount?: BigInt;
    tokenInfo?: TokenInfo;
    fee?: BigInt;
    data?: Base64;
    difficulty?: BigInt;
    nonce?: Base64;
    signature: Base64;
    quotaByStake?: Uint64;
    totalQuota?: Uint64;
    vmlogHash?: Hex;

    triggeredSendBlockList?: AccountBlock[]
    confirmations?: Uint64;
    firstSnapshotHash?: Hex;
    timestamp?: Uint64;
    receiveBlockHeight?: Uint64;
    receiveBlockHash?: Hex;
}

export interface RewardInfo {
	totalReward: BigInt;
	blockProducingReward: BigInt;
	votingReward: BigInt;
	producedBlocks: BigInt;
	targetBlocks: BigInt;
}

export interface RewardByDayInfo {
	rewardMap: ReadonlyMap<string, RewardInfo>;
	startTime: Int64;
	endTime: Int64;
	cycle: Uint64;
}

export interface Receiver {
	address: Address;
	amount: BigInt;
}

export interface SBPVoteDetail {
	blockProducerName: string;
	totalVotes: BigInt;
	blockProducingAddress: Address;
	historyProducingAddresses: ReadonlyArray<Address>;
	addressVoteMap: AddressVoteMap;
}

export interface AddressVoteMap {
	[key: string]: string;
}

// Convert RAW units to VITE (18 decimal points)
export const rawToVite = function(raw) {
    return raw / 1e18;
}