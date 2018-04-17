var rpc = require('node-json-rpc');

var options = {
    port: 3000,
    host: 'localhost',
    path: '/',
    strict: true,
    login: 'payme',
    hash: '789'
};

var client = new rpc.Client(options);

client.call(
        {"jsonrpc": "2.0",
            "method": "CheckPerformTransaction",
            "params": {
                "amount": 2000,
                "account": {
                    "no": "5ad05a0dbc0fedfb9d7322f2"
                }
            },
            "id": 1},
        function (err, res) {
            // Did it all work ?
            if (err) {
                console.log('ERROR:', err);
            } else {
                console.log('RES:', res);
            }
        }
);



