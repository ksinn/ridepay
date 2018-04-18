var Mongo = require('./db');

setNewPassword = function (user, col) {
    Mongo.execute(function (err, db) {
        if (!err) {
            var collection = db.collection('user');
            collection.update({login: user.login}, user, function (err, res) {
                if (!err) {
                    //Обновлено успешно
                    col(res.result.nModified === 1 ? user : null, null);
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

createUser = function (user, col) {
    Mongo.execute(function (err, db) {
        if (!err) {
            var collection = db.collection('user');
            collection.insertOne(user, function (err, res) {
                if (!err) {
                    //Обновлено успешно
                    col(user, null);
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

checkUser = function (username, password, col) {
    Mongo.execute(function (err, db) {
        if (!err) {
            var collection = db.collection('user');
            collection.findOne({'login': username}, function (err, doc) {
                if (!err) {
                    var db_user = false;
                    if (doc) {
                        db_user = doc.password == password;
                    }
                    col(db_user);
                } else {
                    col(false);
                }
            });
        } else {
            //Ошибка чтения из бд
            return null;
        }
    });
};

checkPaymeUser = function (user, col) {
    console.log(user);
    if (user[0] == "Paycom" && user[1]=="Uzcard") {        
        checkUser("payme", user[2], function (res) {
            col(res ? user : null);
        });
    } else {
        col(null);
    }
};

exports.setNewPassword = setNewPassword;
exports.checkUser = checkUser;
exports.checkPaymeUser = checkPaymeUser;
exports.createUser = createUser;
