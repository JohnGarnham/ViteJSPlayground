import { Int64, Uint64, RPCResponse } from '@vite/vitejs/distSrc/utils/type';
import { Address, BigInt, AddressObj } from '@vite/vitejs/distSrc/accountblock/type';

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