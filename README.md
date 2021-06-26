# ViteJSPlayground
Various example scripts of how to use ViteJS library

$ node showSBPRewardsByCycle [cycle]

Generates a CSV file with the rewards summary for either the current cycle or whatever cycle the user specified

$ node showVoterRewardsByCycleAndSBP [cycle] [SBP]

Generates a CSV file with voter rewards data for the cycle and SBP specified. 
If not specifies it uses the current cycle and ViNo Community Node as default.

$ node generateNewWallet

Generates a new wallet with random mnemonic and list of addresses

$ node walletFromMnemonic

Shows wallet information from specified mnemonic

$ node postTweetTest

Posts a test tweet on Twitter with reward summary data. You need Twitter API keys for this to work
