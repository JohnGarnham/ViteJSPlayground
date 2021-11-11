
import { exitOnError } from 'winston';

import WS_RPC from '@vite/vitejs-ws';
import { ViteAPI } from '@vite/vitejs';

// Grab data from .env
require('dotenv').config();

// User can pass in optional cycle number
const accountLookup = process.argv[2];
const _from = process.argv[3];
const _to = process.argv[4];
var from = 0;
var to = 0;

if(accountLookup == undefined) {
    console.error("Must specify account to watch as a parameter");
    process.exit();
}

if(_from != undefined) {
    from = parseInt(_from);
} else {
    from = 0;
}

if(_to != undefined) {
    to = parseInt(_to);
} else {
    to = 0;
}
console.log("Watching for " + accountLookup + " From: " + from + " To: " + to);


// Grab files from .env
const RPC_NET = process.env.TESTNETWS || 'ws://localhost:23457';

const wsService = new WS_RPC(RPC_NET);

const viteClient = new ViteAPI(wsService, () => {
	console.log('Vite client successfully connected: ');
});


const watchVmSubscription = async (accountNumber: string, from?: number, to? :number) => {
    const filterParams = { 'addressHeightRange': { [accountNumber]: { 'fromHeight': '0', 'toHeight': '0' } } }
    // Call subscription for logs from VM with that particular address
    let subscription = await viteClient.subscribe('createVmlogSubscription', filterParams)
        .then(event => {
            console.log(event);
        }).catch(err => console.log(err));
}

watchVmSubscription(accountLookup,from,to)
.catch(error => {
	console.error("Error watching account: " + error);
});