import { HTTP_RPC } from '@vite/vitejs-http';
import { ViteAPI } from '@vite/vitejs';
import { RPCResponse } from '@vite/vitejs/distSrc/utils/type';
import {getLatestCycleTimestampFromNow, getYYMMDD} from './timeUtil';
import { SBPVoteDetail, RewardByDayInfo, Receiver, rawToVite } from './viteTypes'

// Grab data from .env
require('dotenv').config();

// Grab files from .env
const RPC_NET = process.env.RPC_NET || 'ws://localhost:23457';
const SBP_NAME = process.env.SBP_NAME || 'ViNo_Community_Node';
const DEV_FUND_PERCENTAGE = process.env.DEV_FUND_PERCENTAGE || 50;
const COMMUNITY_FUND_PERCENTAGE = process.env.COMMUNITY_FUND_PERCENTAGE || 10;

// Initialize ViteClient
const httpProvider = new HTTP_RPC(RPC_NET);
const viteClient = new ViteAPI(httpProvider, () => {
	console.log('Vite client successfully connected: ');
});


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

// getSBPVoteDetails
// blockProducer - the SBP node to find data for
// cycleNumber - optional to override for specific cycle number
// SBPOverride - optional to override SBP
const getSBPVoteDetails = async (blockProducer: string, cycleNumber?: string) => {
	// Grab rewardByDayInfo
	let rewardByDayInfo: RewardByDayInfo;
    if (cycleNumber) {
		console.log("Grabbing daily SBP reward information for cycle ", cycleNumber, " and SBP ", blockProducer);
		// Grab daily reward info for specified cycle #
        rewardByDayInfo = await getSBPRewardByCycle(cycleNumber).catch((res: RPCResponse) => {
            console.log(`Could not retrieve SBP rewards for cycle ${cycleNumber}`, res);
            throw res.error;
        });
    } else {
		// Grab daily reward info for current cycle #
		console.log("Grabbing daily SBP reward information for current cycle and SBP ", blockProducer);
        rewardByDayInfo = await getSBPRewardByTimestamp(getLatestCycleTimestampFromNow()).catch((res: RPCResponse) => {
            console.log(`Could not retrieve SBP rewards.`, res);
            throw res.error;
        });
    }
	const {rewardMap, cycle} = rewardByDayInfo;
	// Calculate reward distributions
	const devFundWeight = Number(DEV_FUND_PERCENTAGE) / 100;
	const communityFundWeight = Number(COMMUNITY_FUND_PERCENTAGE) / 100;
	const totalReward = Number.parseInt(rewardMap[blockProducer]?.totalReward ?? '0');
	const voterRewardPool = totalReward * (1 - devFundWeight - communityFundWeight);
	console.log(`Total Reward: ${totalReward.toPrecision(22)}`);
     // Now grab SBP vote details of this particular cycle
    var fs = require('fs');
    const dateTimeStr = getYYMMDD();    // Use YYMMDDHHMMss to make filename unique and easily sortable
    const voteDetails: ReadonlyArray<SBPVoteDetail> = await viteClient.request('contract_getSBPVoteDetailsByCycle', cycle);
    var filename = dateTimeStr + blockProducer + "voteDetailsByCycle" + String(cycle) + ".csv";
	var stream = fs.createWriteStream(filename);
	stream.once('open', function(fd) {
        stream.write("Addresss,Vote Weight (VITE),Weight Percentage,Weighted Reward (VITE)\n");
        for(var i = 0; i < voteDetails.length; i++) {
            const vote : SBPVoteDetail = voteDetails[i];
            // Find vote details that have a matching block producer name
            if(vote.blockProducerName == blockProducer) {
                stream.write(vote.totalVotes)
                // Grab address vote map
                const voteMap = vote.addressVoteMap; // map<string address, string bigint> 
                let totalVotes = vote.totalVotes;   // Total # of vote
                for (const address in voteMap) {
                    const voteWeight = voteMap[address];
                    let votePercent = (Number(voteWeight) / Number(totalVotes));
                    const weightedReward = Math.floor(votePercent * voterRewardPool);
                    //console.log(`Address: ${address} Vote: ${voteWeight} ${votePercent * 100}%,Weight Reward: ${weightedReward}`);
                    stream.write(`${address},${rawToVite(voteWeight)},${votePercent * 100}%,${rawToVite(weightedReward)}\n`);
                }
            }
        }
        stream.end();
    });
    console.log(`Created spreadsheet with voter reward data in ${filename}`);
}

// User can pass in optional cycle number
const cycleOverride = process.argv[2];
const SBPOverride = process.argv[3];
// See if user wants to override SBP
let blockProducer = "";
if(SBPOverride != undefined) {
    blockProducer = SBPOverride;
} else {
    blockProducer = SBP_NAME;
}
// Get SBP vote data for SBP node and optional cycle number
getSBPVoteDetails(blockProducer,cycleOverride)
.catch(error => {
	console.error("Could not get SBP vote details for " + SBP_NAME + ":" + error.message);
});