var Mongo = require('./db');

getTransaction = function (id, col) {
    Mongo.execute(function (err, db) {
        if (!err) {
            var collection = db.collection('transaction');
            collection.findOne({'id': id}, function (err, doc) {
                if (!err) {
                    if (doc) {
                        doc.transaction = doc._id;
                        delete doc._id;
                    }
                    col(doc, null);
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

getTransactions = function (from, to, col) {
    Mongo.execute(function (err, db) {
        if (!err) {
            var collection = db.collection('transaction');
            collection.find({$and: [{time: {$lte: to}}, {time: {$gte: from}}]}, function (err, docs) {
                if (!err) {
                    docs.toArray(function (err, docs, ) {
                        col(docs, null);
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

saveNewTransaction = function (trans, col) {
    Mongo.execute(function (err, db) {
        if (!err) {
            var collection = db.collection('transaction');
            collection.insertOne(trans, function (err, res) {
                if (!err) {
                    //Успешная запись
                    trans.transaction = res.insertedId;
                    col(trans, null);
                } else {
                    //Ошибка записи
                    col(null, err);
                }
            });
        } else {
            //Ошибка чтения из бд
            col(null, err);
        }

    });
};

saveTransaction = function (trans, col) {
    Mongo.execute(function (err, db) {
        if (!err) {
            var collection = db.collection('transaction');
            trans_no = trans.transaction;
            delete trans.transaction;
            collection.update({id: trans.id}, trans, function (err, res) {
                if (!err) {
                    //Успешная запись
                    trans.transaction = trans_no;
                    col(res.result.nModified===1?trans:null, null);
                } else {
                    //Ошибка записи
                    col(null, err);
                }
            });
        } else {
            //Ошибка чтения из бд
            col(null, err);
        }

    });
};


exports.getTransaction = getTransaction;
exports.saveTransaction = saveTransaction;
exports.saveNewTransaction = saveNewTransaction;
exports.getTransactions = getTransactions;