var Wallet = require('./wallet_controll');
var Payout = require('./payout_transaction_controll');

walletInfo = function (req, res) {
    if (req.params.no === 'new') {
        res.render('wallet_new');
    } else {
        Wallet.getWallet(req.params.no, function (result, err) {
            if (!err) {
                if (result) {
                    Payout.getPayouts(result.no, new Date().getTime() - 3600 * 24 * 30 * 1000, new Date().getTime(), function (docs, err) {
                        result.payouts = docs;
                        res.render('wallet', {wallet: result});
                    });
                } else {
                    res.render('error', {error: "Не найден такой кошелек"});
                }
            } else {
                res.render('error', {error: err});
            }
        });

    }
};

addWallet = function (req, res) {
    console.log(req.body);
    wallet = req.body;
    wallet.amount = 0;
    Wallet.saveNewWallet(wallet, function (result, err) {
        if (!err) {
            res.redirect('/wallet/' + result.no);
        } else {
            res.render('error', {error: err});
        }
    });

};

doPayout = function (req, res) {
    payout = req.body;
    if(payout.amount<0){
        res.render('error', {error: "Неверная сумма"});
        return;
    }
    Wallet.getWallet(payout.account.no, function (wallet, err) {
        if (!err) {
            if (wallet) {
                if (wallet.amount > payout.amount) {
                    payout.time = new Date().getTime();
                    Payout.savePayout(payout, function (result, err) {
                        if (!err) {
                            if (result) {
                                Wallet.getMoney(payout.account.no, payout.amount, function (saveResult, err) {
                                    if (!err) {
                                        if (result) {
                                            if (!err) {
                                                if (saveResult) {
                                                    res.render('payout', {payout: result});
                                                } else {
                                                    res.render('error', {error: "Выплата не совершена"});
                                                }
                                            } else {
                                                res.render('error', {error: err});
                                            }
                                        } else {
                                            res.render('error', {error: "Выплата не совершена"});
                                        }
                                    } else {
                                        res.render('error', {error: err});
                                    }
                                });
                            } else {
                                res.render('error', {error: "Выплата не совершена"});
                            }
                        } else {
                            res.render('error', {error: err});
                        }
                    });
                } else {
                    res.render('error', {error: "Недостаточно средств"});
                }
            } else {
                res.render('error', {error: "Кашелек не найден"});
            }
        } else {
            res.render('error', {error: err});
        }
    });



};

exports.walletInfo = walletInfo;
exports.addWallet = addWallet;
exports.doPayout = doPayout;


