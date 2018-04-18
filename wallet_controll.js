var Mongo = require('./db');

getWallet = function (no, col) {
    Mongo.execute(function (err, db) {
        if (!err) {
            var collection = db.collection('wallet');
            var o_id = Mongo.newObjectID(no);
            if (o_id) {
                //Верный формат no
                collection.findOne({'_id': o_id}, function (err, doc) {
                    if (!err) {
                        if (doc) {
                            doc.no = doc._id;
                            delete doc._id;
                        }
                        col(doc, null);
                    } else {
                        col(null, err);
                    }
                });
            } else {
                //Не верный формат nо
                col(null, {message: "Error no format"});
            }
        } else {
            //Ошибка чтения из бд
            col(null, err);
        }

    });

};

getWallets = function (query, col) {
    Mongo.execute(function (err, db) {
        if (!err) {
            var collection = db.collection('wallet');
            collection.find(query, function (err, docs) {
                if (!err) {
                    docs.toArray(function (err, docs) {
                        if (!err) {
                            col(docs, null);
                        } else {
                            col(null, err);
                        }
                    });
                } else {
                    col(null, err);
                }
            });
        } else {
            //Ошибка чтения из бд
            col(null, err);
        }

    });

};


saveWallet = function (wallet, col) {
    Mongo.execute(function (err, db) {
        if (!err) {
            var collection = db.collection('wallet');
            var o_id = Mongo.newObjectID(wallet.no);
            if (o_id) {
                delete wallet.no;
                collection.update({'_id': o_id}, wallet, function (err, updated_doc) {
                    if (!err) {
                        //Обновлено успешно
                        wallet.no = o_id;
                        col(updated_doc.result.nModified === 1 ? wallet : null, null);
                    } else {
                        //Обновление с ошибкой
                        col(null, err);
                    }
                });
            } else {
                //Не верный формат nо
                col(null, {message: "Error no format"});
            }
        } else {
            //Ошибка подключения к бд
            col(null, err);
        }
    });
};

saveNewWallet = function (wallet, col) {
    Mongo.execute(function (err, db) {
        if (!err) {
            var collection = db.collection('wallet');
            collection.insertOne(wallet, function (err, res) {
                if (!err) {
                    //Обновлено успешно
                    wallet.no = res.insertedId;
                    col(wallet, null);
                } else {
                    //Обновление с ошибкой
                    col(null, err);
                }
            });
        } else {
            //Ошибка подключения к бд
            col(null, err);
        }
    });
};

putMoney = function (no, amount, col) {
    if (amount < 0) {
        col(null, {message: {ru: "Неверная сумма"}});
        return;
    }
    getWallet(no, function (res, err) {
        if (!err) {
            //Кошелек найден
            res.amount += amount;
            saveWallet(res, function (res, err) {
                col(res, err);
            });
        } else {
            //кошелек не найден
            col(null, err);
        }
    });
};

getMoney = function (no, amount, col) {
    if (amount < 0) {
        col(null, {message: {ru: "Неверная сумма"}});
        return;
    }
    getWallet(no, function (res, err) {
        if (!err) {
            //Кошелек найден
            res.amount -= amount;
            saveWallet(res, function (res, err) {
                col(res, err);
            });
        } else {
            //кошелек не найден
            col(null, err);
        }
    });
};

exports.getWallet = getWallet;
exports.getWallets = getWallets;
exports.putMoney = putMoney;
exports.getMoney = getMoney;
exports.saveNewWallet = saveNewWallet;
exports.saveWallet = saveWallet;