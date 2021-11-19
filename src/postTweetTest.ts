var Twit = require('twit')

require('dotenv').config();

// Maximum length a Tweet can be
const MAX_TWEET_LENGTH = 280;
// Build Twitter API client with our API keys
const T = new Twit({
	consumer_key:         process.env.CONSUMER_KEY,
	consumer_secret:      process.env.CONSUMER_SECRET,
	access_token:         process.env.ACCESS_TOKEN,
	access_token_secret:  process.env.ACCESS_TOKEN_SECRET
})

// Convert RAW units to VITE (18 decimal points)
const rawToVite = function(raw) {
    return raw / 1e18;
}
// Function to generate reward Tweet
const generateMessage = function(totalReward,voterReward,devFund,communityFund,precision) {
	var text = `Today's $VITE voter rewards have been distributed ✅

	A total of ${rawToVite(totalReward).toFixed(precision)} $VITE was distributed between:
	- Vite Voters: ${rawToVite(voterReward).toFixed(precision)} VITE
	- Dev Fund: ${rawToVite(devFund).toFixed(precision)} VITE
	- Community Fund: ${rawToVite(communityFund).toFixed(precision)} VITE
	
	Your reward is proportional to your # of votes.`;
	return text;
}

// These values are plugged in from elsewhere
var totalReward = 9996214366662432423423
var voterReward = 7776356344862
var devFund = 666326364654345
var communityFund = 24025451221
var precision = 20;

// Generate Tweet message
var message = generateMessage(totalReward,voterReward,devFund,communityFund,precision);
// Reduce length if needed
console.log("Length: ", message.length);
while(message.length > MAX_TWEET_LENGTH) {
	precision--;
	console.log(`Twitter message is too long! Cannot post! Reducing length. Using new precision ${precision}`);
	message = generateMessage(totalReward,voterReward,devFund,communityFund,precision);
	console.log("New Length: ", message.length);
}

// Post to Twitter
var res = {status: message};
T.post('statuses/update', res,
	function(err, data, response) {
      console.log(data);
    }
  );
