var Mongo = require('./db');

savePayout = function (payout, col) {
    Mongo.execute(function (err, db) {
        if (!err) {
            var collection = db.collection('payout');
            collection.insertOne(payout, function (err, res) {
                if (!err) {
                    //Обновлено успешно
                    payout._id = res.insertedId;
                    col(payout, null);
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

getPayouts = function (no, from, to, col) {
    Mongo.execute(function (err, db) {
        if (!err) {
            var collection = db.collection('payout');
            collection.find({$and: [{time: {$gte: from}}, {time: {$lte: to}}, {'account.no':String(no)}]}, function (err, docs) {
                if (!err) {
                    //Обновлено успешно
                    docs.toArray(function(err, docs){
                        col(docs, err);
                    });
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

exports.getPayouts = getPayouts;
exports.savePayout = savePayout;
