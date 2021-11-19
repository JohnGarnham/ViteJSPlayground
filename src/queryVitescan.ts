const fetch = require('node-fetch');
var path = require('path');
var tti = "";

// Check argument count
if(process.argv.length != 3) {
  console.log("Usage: " + path.basename(process.argv[1]) + " <tti>");
  process.exit();
}
tti = process.argv[2];

// Construct url
const url = "https://vitescan.io/vs-api/token?tokenId=" + tti;

// Fetch URL. Print output
fetch(url)
.then(response => {
    if (!response.ok) {
        throw new Error("HTTP error " + response.status);
    }
    return response.json();
})
.then(json => {
  // Output CSV file with holder data
  let data = json.data;
  console.log("Holders: " + data.holderCount);
  // Headers
  console.log("Address,Balance,Percentage,Tx Count")
  // Output each account data as CSV string
  for(var i = 0; i < data.accountsResults.length; i++) {
    let account = data.accountsResults[i];
    console.log([account.address,account.balance,account.percentage,account.txnCount].join(','));
  }
}) 
.catch(function (error) {
  console.log(error);
})