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
.then(response => response.text())
.then(data => console.log(data));