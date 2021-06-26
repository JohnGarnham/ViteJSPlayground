import { HTTP_RPC } from '@vite/vitejs-http';
import { ViteAPI, wallet, accountBlock } from '@vite/vitejs';
import { Address, BigInt, AddressObj } from '@vite/vitejs/distSrc/accountblock/type';
import { Int64, Uint64, RPCResponse } from '@vite/vitejs/distSrc/utils/type';
import { getLatestCycleTimestampFromNow } from './timeUtil';

require('dotenv').config();

const { createAccountBlock } = accountBlock;

interface Receiver {
	address: Address;
	amount: BigInt;
}

// Grab files from .env
const RPC_NET = process.env.RPC_NET || 'ws://localhost:23457';
const DEV_FUND_PERCENTAGE = process.env.DEV_FUND_PERCENTAGE || 50;
const COMMUNITY_FUND_PERCENTAGE = process.env.COMMUNITY_FUND_PERCENTAGE || 10;
const COMMUNITY_FUND_WALLET = process.env.COMMUNITY_FUND_ADDRESS || '';
const DEV_FUND_ADDRESS = process.env.DEV_FUND_ADDRESS || '';

// Initialize ViteClient
const httpProvider = new HTTP_RPC(RPC_NET);
const viteClient = new ViteAPI(httpProvider, () => {
	console.log('Vite client successfully connected: ');
});

// derive account from seed phrase. Refer to https://docs.vite.org/vite.js/wallet/
const sendAccount: AddressObj = wallet.getWallet(process.env.MNEMONICS).deriveAddress(0);

const sendTx = async (address: Address, amount: BigInt) => {
	// Build new send block
	const block = createAccountBlock('send', {
		address: sendAccount.address,
		toAddress: address,
		amount,
	})
		.setProvider(viteClient)
		.setPrivateKey(sendAccount.privateKey);
	// Link block to previous block
	await block.autoSetPreviousAccountBlock();
	console.log("Height: " + block.height + " Previous Hash: " + block.previousHash + " Hash: " + block.hash);
	// Send block
	return block.sendByPoW();
};

const sendLoopInterval = 20 * 1000;
const sendLoop = (receivers: ReadonlyArray<Receiver>) => {
	console.log(`Sending to ${receivers.length} receivers.`);
	receivers.forEach(async (receiver, index) => {
		setTimeout(async () => {
			const { address, amount } = receiver;
			await sendTx(address, amount)
				.then(() => console.log(`Successfully sent ${amount} to ${address}.`))
				.catch(err => console.error(`Could not send ${amount} to ${address}: ${err.error.message}`));
		}, sendLoopInterval * index);
	});
};

interface RewardInfo {
	totalReward: BigInt;
	blockProducingReward: BigInt;
	votingReward: BigInt;
	producedBlocks: BigInt;
	targetBlocks: BigInt;
}

interface RewardByDayInfo {
	rewardMap: ReadonlyMap<string, RewardInfo>;
	startTime: Int64;
	endTime: Int64;
	cycle: Uint64;
}

interface SBPVoteDetail {
	blockProducerName: string;
	totalVotes: BigInt;
	blockProducingAddress: Address;
	historyProducingAddresses: ReadonlyArray<Address>;
	addressVoteMap: AddressVoteMap;
}

interface AddressVoteMap {
	[key: string]: string;
}

// Return SBP rewards in 24h by timestamp. Rewards of all SBP nodes in the cycle that the given timestamp belongs will be returned. 
// https://docs.vite.org/go-vite/api/rpc/contract_v2.html#contract-getsbprewardbytimestamp 
const getSBPRewardByTimestamp = async (timestamp: number) => {
	console.log("Grabbing rewards info for " + timestamp)
	// Make RPC call pass in timestamp in seconds
	const rewardByDayInfo: RewardByDayInfo = await viteClient.request('contract_getSBPRewardByTimestamp', timestamp);
	// Return the daily reward information
	return rewardByDayInfo;
};

const getSBPRewardByCycle = async (cycle: string) => {
    const rewardByDayInfo: RewardByDayInfo = await viteClient.request('contract_getSBPRewardByCycle', cycle);
    return rewardByDayInfo;
};


const getSBPVoteDetailsBy = async (blockProducer: string, cycleNumber?: string): Promise<Receiver[]> => {
	let rewardByDayInfo: RewardByDayInfo;
    if (cycleNumber) {
        rewardByDayInfo = await getSBPRewardByCycle(cycleNumber).catch((res: RPCResponse) => {
            console.log(`Could not retrieve SBP rewards for cycle ${cycleNumber}`, res);
            throw res.error;
        });
    } else {
        rewardByDayInfo = await getSBPRewardByTimestamp(getLatestCycleTimestampFromNow()).catch((res: RPCResponse) => {
            console.log(`Could not retrieve SBP rewards.`, res);
            throw res.error;
        });
    }
	const {rewardMap, cycle} = rewardByDayInfo;
	console.log(`Running for cycle: ${cycle}`);
	// Calculate reward distributions
	const devFundWeight = Number(DEV_FUND_PERCENTAGE) / 100;
	const communityFundWeight = Number(COMMUNITY_FUND_PERCENTAGE) / 100;
	const totalReward = Number.parseInt(rewardMap[blockProducer]?.totalReward ?? '0');
	const voterRewardPool = totalReward * (1 - devFundWeight - communityFundWeight);

	const devReceiver: Receiver = {
		address: DEV_FUND_ADDRESS,
		amount: (totalReward * devFundWeight).toPrecision(22).toString(),
	};
	const communityReceiver: Receiver = {
		address: COMMUNITY_FUND_WALLET,
		amount: (totalReward * communityFundWeight).toPrecision(21).toString(),
	};
	console.log(`Total Reward: ${totalReward.toPrecision(22)}`);
	return viteClient
		.request('contract_getSBPVoteDetailsByCycle', cycle)
		.then((voteDetails: ReadonlyArray<SBPVoteDetail>): Receiver[] =>
			voteDetails
				.filter(voteDetail => voteDetail.blockProducerName === blockProducer)
				.map(({ totalVotes, addressVoteMap }) =>
					Object.keys(addressVoteMap).map(
						(key): Receiver => {
							const addressVotes = addressVoteMap[key];
							const weightedReward = Math.floor(
								(Number(addressVotes) / Number(totalVotes)) * voterRewardPool
							);
							if (weightedReward > 0) {
								return { address: key, amount: weightedReward.toString() };
							}
						}
					)
				)
				.reduce((a, b) => a.concat(b), [])
		)
		.then(receivers => receivers.filter(x => x != null || x != undefined))
		.then(receivers => [...receivers, devReceiver, communityReceiver])
		.catch(err => {
			console.warn(err);
			return [];
		});
};

const prepareSBDVoteDetails = (cycleNumber?: string) => {
	getSBPVoteDetailsBy('ViNo_Community_Node',cycleNumber)
		.then(receivers => {
			if (receivers.length < 1) {
				console.warn(`There are no receivers.`);
				return;
			}
			console.log(`Receivers: ${JSON.stringify(receivers)}`);
			sendLoop(receivers);
		})
		.catch(error => {
			console.error('onRejected function called: ' + error.message);
		});
};

const args = process.argv;
const cycleNumber = args[2];
console.log("Cycle number: ", cycleNumber);
prepareSBDVoteDetails(cycleNumber);