var Wallet = require('./wallet_controll');
var Transaction = require('./transaction_controll');
var Auth = require('./auth_controll');

var timeout = 43200000;

var CheckPerformTransaction = function (para, callback) {
    var error, result;
    if (para.amount > 0) {
        Wallet.getWallet(para.account.no, function (res, err) {
            if (!err) {
                if (res) {
                    result = {"allow": true};
                } else {
                    //Не найден кошелек
                    error = {
                        code: -31050,
                        message: {
                            ru: "Кошелек не найден",
                            en: "Wallet not found",
                            uz: "Vdfbdfb"
                        },
                        data: "no"
                    };
                }
            } else {
                //Ошибка чтения кошелька из БД
                error = {code: -32400};
            }
            callback(error, result);
        });
    } else { 
        //Не правельная сумма перевода
        error = {
            code: -31001,
            message: {
                ru: "Не верная сумма платежа",
                en: "Error amount",
                uz: "Vdfbdfb"
            },
            data: "no"
        };
        callback(error, result);
    }
};

var CreateTransaction = function (para, callback) {
    var error, result = {};
    Transaction.getTransaction(para.id, function (res, err) {

        if (!err) {
            if (res) {
                ;
                //Транзакция найдена
                if (res.state === 1) {
                    if ((new Date().getTime() - res.time) > timeout) {
                        //Отклонение транзакции по таймеру
                        res.state = -1;
                        res.reason = 4;
                        res.cancel_time = new Date().getTime();
                        Transaction.saveTransaction(res, function (res, er) {
                            if (!er) {
                                error = {code: -31008};
                            } else {
                                error = {code: -32400};
                            }
                            callback(error, result);
                        });
                    } else {
                        //Отправить данные транзакции
                        result.state = res.state;
                        result.transaction = res.transaction;
                        result.create_time = res.create_time;
                        callback(error, result);
                    }
                } else {
                    error = {code: -31008};
                    callback(error, result);
                }
            } else {
                //Транзакция не найдена
                CheckPerformTransaction(para, function (er, res) {
                    if (!er) {
                        if (res && res.allow) {
                            //Транзакция прошла проверку.
                            para.state = 1;
                            para.create_time = new Date().getTime();
                            Transaction.saveNewTransaction(para, function (res, er) {
                                if (!er) {
                                    //Отправить данный транзакции
                                    result.state = res.state;
                                    result.transaction = res.transaction;
                                    result.create_time = res.create_time;
                                } else {
                                    //Ошибка сохранения транзакции в БД
                                    error = {code: -32400};
                                }
                                callback(error, result);
                            });
                        } else {
                            //Транзакция не прошла проверку
                            callback(er, res);
                        }
                    } else {
                        //Транзакция не прошла проверку
                        callback(er, res);
                    }

                });
            }
        } else {
            //Ошибка чтения транзакции из БД
            error = {code: -32400};
            callback(error, result);
        }
    });
};

var PerformTransaction = function (para, callback) {
    var error, result = {};
    Transaction.getTransaction(para.id, function (res, err) {
        if (!err) {
            if (res) {
                switch (res.state) {
                    //Транзакция готова к обработке
                    case 1:
                    {
                        if ((new Date().getTime() - res.time) > timeout) {
                            //Отклонение транзакции по таймеру
                            res.state = -1;
                            res.reason = 4;
                            res.cancel_time = new Date().getTime();
                            Transaction.saveTransaction(res, function (res, er) {
                                if (!er) {
                                    error = {code: -31008};
                                } else {
                                    error = {code: -32400};
                                }
                                callback(error, result);
                            });
                        } else {
                            //Зачисление денег на счет
                            Wallet.putMoney(res.account.no, res.amount, function (wallet_res, walle_err) {
                                if (!walle_err) {
                                    if (wallet_res) {
                                        //Кошелек пополнен
                                        res.state = 2;
                                        res.perform_time = new Date().getTime();
                                        Transaction.saveTransaction(res, function (res, er) {
                                            if (!er) {
                                                result.state = res.state;
                                                result.perform_time = res.perform_time;
                                                result.transaction = res.transaction;
                                            } else {
                                                //Ошибка записи транзакции в БД
                                                error = {code: -32400};
                                            }
                                            callback(error, result);
                                        });
                                    } else {
                                        //Не найден кошелек для пополнения
                                        error = {
                                            code: -31050,
                                            message: {
                                                ru: "Кошелек не найден",
                                                en: "Wallet not found",
                                                uz: "Vdfbdfb"
                                            },
                                            data: "no"
                                        };
                                    }
                                } else {
                                    //Ошибка БД при пополнение кошелька
                                    error = {code: -32400};
                                    callback(error, result);
                                }
                            });
                        }
                        break;
                    }
                    //Транзакция уже обработана
                    case 2:
                    {
                        result.state = res.state;
                        result.perform_time = res.perform_time;
                        result.transaction = res.transaction;
                        callback(error, result);
                        break;
                    }
                    default:
                    {
                        error = {code: -31008};
                        callback(error, result);
                    }
                }
            } else {
                //Транзакция не найдена
                error = {code: -31003};
                callback(error, result);
            }
        } else {
            //Ошибка чтения из БД
            error = {code: -32400};
            callback(error, result);
        }
    });

};

var CancelTransaction = function (para, callback) {
    var error, result = {};
    Transaction.getTransaction(para.id, function (res, err) {
        if (!err) {
            if (res) {
                switch (res.state) {
                    //Транзакция еще не завершена
                    case 1:
                    {
                        res.cancel_time = new Date().getTime();
                        res.state = -1;
                        res.reason = para.reason;
                        Transaction.saveTransaction(res, function (res, er) {
                            if (!er) {
                                result.state = res.state;
                                result.cancel_time = res.cancel_time;
                                result.transaction = res.transaction;
                            } else {
                                //Ошибка записи транзакции в БД
                                error = {code: -32400};
                            }
                            callback(error, result);
                        });
                        break;
                    }
                    //Транзакция уже завершена
                    case 2:
                    {
                        Wallet.getWallet(res.account.no, function (wallet_res, wallet_err) {
                            if (!wallet_err) {
                                if (wallet_res) {
                                    if (wallet_res.amount > res.amount) {
                                        //Денег для отмены достаточно
                                        Wallet.getMoney(wallet_res.no, res.amount, function (return_res, return_err) {
                                            if (!return_err) {
                                                res.state = -2;
                                                res.cancel_time = new Date().getTime();
                                                res.reason = para.reason;
                                                Transaction.saveTransaction(res, function (res, er) {
                                                    if (!er) {
                                                        result.state = res.state;
                                                        result.cancel_time = res.cancel_time;
                                                        result.transaction = res.transaction;
                                                    } else {
                                                        //Ошибка записи транзакции в БД
                                                        error = {code: -32400};
                                                    }
                                                    callback(error, result);
                                                });
                                            } else {
                                                //Ошибка БД при снятие денег с кошелька
                                                error = {code: -32400};
                                                callback(error, result);
                                            }
                                        });
                                    } else {
                                        //Денег для отмены не достаточно
                                        error = {code: -31007};
                                        callback(error, result);
                                    }
                                } else {
                                    //Не найден кошелек
                                    error = {
                                        code: -31050,
                                        message: {
                                            ru: "Кошелек не найден",
                                            en: "Wallet not found",
                                            uz: "Vdfbdfb"
                                        },
                                        data: "no"
                                    };
                                    callback(error, result);
                                }
                            } else {
                                //Ошибка чтения кошелька из БД
                                error = {code: -32400};
                                callback(error, result);
                            }
                        });
                        break;
                    }
                    default:
                    {
                        result.state = res.state;
                        result.cancel_time = res.cancel_time;
                        result.transaction = res.transaction;
                        callback(error, result);
                    }
                }
            } else {
                //Транзакция не найдена
                error = {code: -31003};
                callback(error, result);
            }
        } else {
            //Ошибка чтения транзакции из БД
            error = {code: -32400};
            callback(error, result);
        }
    });


};

var CheckTransaction = function (para, callback) {
    var error, result = {};
    Transaction.getTransaction(para.id, function (res, err) {
        if (!err) {
            if (res) {
                result = res;
            } else {
                //Транзакция не найдена
                error = {code: -31003};
            }
            callback(error, result);
        } else {
            //Ошибка чтения транзакции из БД
            error = {code: -32400};
            callback(error, result);
        }
    });
};

var GetStatement = function (para, callback) {
    var error, result = {};
    Transaction.getTransactions(para.from, para.to, function (res, err) {
        if (!err) {
            result.transactions = res;
            callback(error, result);
        } else {
            //Ошибка чтения транзакции из БД
            error = {code: -32400};
            callback(error, result);
        }
    });
};

var ChangePassword = function (para, callback) {
    var error, result = {};
    Auth.setNewPassword({login: "payme", password: para.password}, function (res, err) {
        if (!err) {
            if (res) {
                //Пароль изменен успешно
                result.success = true;
            } else {
                //Пароль не был изменен
                error = {code: -32400};
            }
        } else {
            //Ошибка при изменение пароля
            error = {code: -32400};
        }
        callback(error, result);
    });
};

exports.CheckPerformTransaction = CheckPerformTransaction;
exports.CreateTransaction = CreateTransaction;
exports.PerformTransaction = PerformTransaction;
exports.CancelTransaction = CancelTransaction;
exports.CheckTransaction = CheckTransaction;
exports.GetStatement = GetStatement;
exports.ChangePassword = ChangePassword;
