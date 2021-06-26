
// If not production mode
if (process.env.NODE_ENV !== 'production') {
    // Load environment variables from .env file
    require('dotenv').config();
} else {
    // Testing mode
}

import {HTTP_RPC} from '@vite/vitejs-http';
import {ViteAPI, wallet, accountBlock} from '@vite/vitejs';
import {Address, BigInt, AddressObj} from '@vite/vitejs/distSrc/accountblock/type';
import {Int64, Uint64, RPCResponse} from '@vite/vitejs/distSrc/utils/type';
import {getLatestCycleTimestampFromNow} from './timeUtil';

const {createAccountBlock} = accountBlock;

interface Receiver {
    address: Address;
    amount: BigInt;
}

// put seed phrases here
const RPC_NET = process.env.RPC_NET || 'ws://localhost:23457';
const DEV_FUND_PERCENTAGE = process.env.DEV_FUND_PERCENTAGE || 50;
const COMMUNITY_FUND_PERCENTAGE = process.env.COMMUNITY_FUND_PERCENTAGE || 10;
const COMMUNITY_FUND_WALLET = process.env.COMMUNITY_FUND_ADDRESS || '';
const DEV_FUND_ADDRESS = process.env.DEV_FUND_ADDRESS || '';

// connect to a node
const httpProvider = new HTTP_RPC(RPC_NET);

const vclient = new ViteAPI(httpProvider, () => {
    console.log('Client connected');
});

const sendAccount: AddressObj = wallet.getWallet(process.env.MNEMONICS).deriveAddress(0);


const sendTx = async (address: Address, amount: BigInt) => {
    // Build new send block
    const block = createAccountBlock('send', {
        address: sendAccount.address,
        toAddress: address,
        amount,
    })
        .setProvider(vclient)
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
            const {address, amount} = receiver;
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
//
// @param   timestamp   number   Epoch date in seconds
//
// @return  RewardByDayInfo     Reward information for this particular cycle
const getSBPRewardByTimestamp = async (timestamp: number) => {
    // Make RPC call pass in timestamp in seconds
    const rewardByDayInfo: RewardByDayInfo = await vclient.request('contract_getSBPRewardByTimestamp', timestamp);
    // Return the daily reward information
    return rewardByDayInfo;
};

const getSBPVoteDetailsBy = async (blockProducer: string): Promise<Receiver[]> => {
    // Grab timestamp of current date and time
    const timestamp = getLatestCycleTimestampFromNow();
    // Grab reward information for given timestamp
    const {rewardMap, cycle, endTime, startTime}: RewardByDayInfo = await getSBPRewardByTimestamp(timestamp)
        .catch((res: RPCResponse) => {
            console.error(`Could not retrieve SBP rewards for cycle ${cycle}. ${res.error.code}: ${res.error.message}`);
            throw res.error;
        }
    );

    // Output cycle info
    console.log(`Cycle #${cycle} ${startTime} to ${endTime} for ${timestamp}`);

    // Output reward information
    console.log("Name,Total Reward,Blocks Produced,Voting Reward,Produced Blocks,Target Blocks")
    for (const key in rewardMap) {
        //if (Object.prototype.hasOwnProperty.call(rewardMap, key) && key == blockProducer) {
            const element = rewardMap[key];
            console.log(`${key},${element.totalReward},${element.producedBlocks},${element.votingReward},${element.producedBlocks},${element.targetBlocks}`);
        //}
    }
    // Calculate reward distributions
    const devFundWeight = Number(DEV_FUND_PERCENTAGE) / 100;
    const communityFundWeight = Number(COMMUNITY_FUND_PERCENTAGE) / 100;
    const totalReward = Number.parseInt(rewardMap[blockProducer]?.totalReward ?? '0');
    const voterRewardPool = totalReward * (1 - devFundWeight - communityFundWeight);
    // Dev accounts
    const devReceiver: Receiver = {
        address: DEV_FUND_ADDRESS,
        amount: (totalReward * devFundWeight).toPrecision(22).toString(),
    };
    // Community accounts
    const communityReceiver: Receiver = {
        address: COMMUNITY_FUND_WALLET,
        amount: (totalReward * communityFundWeight).toPrecision(21).toString(),
    };
    console.log(`Total Reward: ${totalReward.toPrecision(22)}`);
   // return Promise.reject(new Error('You smell bad!'));
    // Return promise 
    return vclient
        .request('contract_getSBPVoteDetailsByCycle', cycle)
        .then((voteDetails: ReadonlyArray<SBPVoteDetail>): Receiver[] =>
            voteDetails
                .filter(voteDetail => voteDetail.blockProducerName === blockProducer)
                .map(({totalVotes, addressVoteMap}) =>
                    Object.keys(addressVoteMap).map(
                        (key): Receiver => {
                            const addressVotes = addressVoteMap[key];
                            const weightedReward = Math.floor(
                                (Number(addressVotes) / Number(totalVotes)) * voterRewardPool
                            );
                            if (weightedReward > 0) {
                                return {address: key, amount: weightedReward.toString()};
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

const prepareSBDVoteDetails = () => {
    getSBPVoteDetailsBy('ViNo_Community_Node')
    .then(receivers => {
        // Process receiver list
        if (receivers.length < 1) {
            console.warn(`There are no receivers.`);
            return;
        }
        //console.log(`Receivers: ${JSON.stringify(receivers)}`);
        sendLoop(receivers);
    })
    .catch(error => {
        console.error('onRejected function called: ' + error.message);
    });
};

prepareSBDVoteDetails();

// sendLoop();

// receiveTransaction();
// stakeForQuota(myAccount.address);
// stakeForQuota("vite_...");
// sendTx("vite_...", '10000000000000000000000');

