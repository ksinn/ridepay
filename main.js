var rpc = require('node-json-rpc');
var express = require('express');
var httpAuth = require('http-auth');
var bodyParser = require('body-parser');
var Pay = require('./pay_methods');
var Auth = require('./auth_controll');
var Manager = require('./manager_methods');

var serv = new rpc.Server({
    port: 5080,
    host: 'localhost',
    path: '/',
    strict: true,
    auth: {
        ext: {
            users: Auth.checkPaymeUser
        }
    }
});
//Payme API methods
serv.addMethod('CheckPerformTransaction', Pay.CheckPerformTransaction);
serv.addMethod('CreateTransaction', Pay.CreateTransaction);
serv.addMethod('PerformTransaction', Pay.PerformTransaction);
serv.addMethod('CancelTransaction', Pay.CancelTransaction);
serv.addMethod('CheckTransaction', Pay.CheckTransaction);
serv.addMethod('GetStatement', Pay.GetStatement);
serv.addMethod('ChangePassword', Pay.ChangePassword);


serv.addMethod('ShowWallet', function (para, callback) {
    callback(null, {no: 4654646, amount: 12000, ownr: {name: "Kseniya", famaly: "Andreeva"}});
});

serv.start(function (error) {
    if (error)
        throw error;
    else
        console.log('Server PaymeAPI running ...');
});


var app = express();


var basic = httpAuth.basic({realm: 'SUPER SECRET STUFF'},Auth.checkUser);
var authMiddleware = httpAuth.connect(basic);

app.set('view engine', 'ejs');
app.use(express.static('./public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


app.get('/wallet/:no', authMiddleware, Manager.walletInfo);
app.post('/wallet/new', authMiddleware, Manager.addWallet);
app.post('/payout', authMiddleware, Manager.doPayout);

app.listen(3000, function () {
    console.log('express start on port ', 3000);
});

