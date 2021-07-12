// Usage: $ node showSBPRewardsByCycle <cycle>
//
// Generates a CSV file with the SBP reward summary data for either
// the current cycle or the cycle specified by the user

import { HTTP_RPC } from '@vite/vitejs-http';
import { ViteAPI } from '@vite/vitejs';
import { RPCResponse } from '@vite/vitejs/distSrc/utils/type';
import { getLatestCycleTimestampFromNow, getYYMMDD} from './timeUtil';
import { RewardByDayInfo, rawToVite } from './viteTypes'

require('dotenv').config();

// Grab files from .env
const RPC_NET = process.env.RPC_NET;

// Initialize ViteClient
const httpProvider = new HTTP_RPC(RPC_NET);
const viteClient = new ViteAPI(httpProvider, () => {
	console.log('Vite client successfully connected: ');
});

// Return SBP rewards in 24h by timestamp. Rewards of all SBP nodes in the cycle that the given timestamp belongs will be returned. 
// https://docs.vite.org/go-vite/api/rpc/contract_v2.html#contract-getsbprewardbytimestamp 
const getSBPRewardByTimestamp = async (timestamp: number) => {
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
const getSBPVoteDetails = async (cycleNumber?: string) => {
	// Grab rewardByDayInfo for cycle
	let rewardByDayInfo: RewardByDayInfo;
    if (cycleNumber) {
		console.log("Grabbing daily SBP reward information for cycle ", cycleNumber);
		// Grab daily reward info for specified cycle #
        rewardByDayInfo = await getSBPRewardByCycle(cycleNumber).catch((res: RPCResponse) => {
            console.log(`Could not retrieve SBP rewards for cycle ${cycleNumber}`, res);
            throw res.error;
        });
    } else {
		// Grab daily reward info for current cycle #
		console.log("Grabbing daily SBP reward information for current cycle");
        rewardByDayInfo = await getSBPRewardByTimestamp(getLatestCycleTimestampFromNow()).catch((res: RPCResponse) => {
            console.log(`Could not retrieve SBP rewards.`, res);
            throw res.error;
        });
    }
	const {rewardMap, cycle} = rewardByDayInfo;
    // Output reward information to .CSV file
    var fs = require('fs');
    const dateTimeStr = getYYMMDD();    // Use YYMMDDHHMMss to make filename unique and easily sortable
    var filename = dateTimeStr + "SBPRewardsSummaryCycle" + String(cycle) + ".csv";
    var stream = fs.createWriteStream(filename);
    stream.once('open', function(fd) {
        stream.write(`Cycle #${cycle}\n`);
        stream.write("Name,Total Reward(VITE),Blocking Produced Reward(VITE),Voting Reward(VITE),Produced Blocks,Target Blocks\n")
        for (const key in rewardMap) {
            const element = rewardMap[key];
            // Convert to Vite, divide by 18
            const totalRewardVite = rawToVite(element.totalReward);
            const blockingRewardVite = rawToVite(element.blockProducingReward);
            const votingRewardVite = rawToVite(element.votingReward);
            // Check if the node has been cancelled
            const alert = element.allRewardWithdrawed ? "Cancelled" : "";
            // Write line in CSV file
            stream.write(`${key},${totalRewardVite},${blockingRewardVite},${votingRewardVite},${element.producedBlocks}," + \
                "${element.targetBlocks},${alert}\n`);
        }
        stream.end();
    });
    console.log(`Created spreadsheet with reward data in ${filename}`);
};



// User can pass in optional cycle number
const cycleNumber = process.argv[2];
// Get SBP vote data for SBP node and optional cycle number
getSBPVoteDetails(cycleNumber)
.catch(error => {
	console.error("Error while grabbing SBP rewards summary :" + error.message);
});