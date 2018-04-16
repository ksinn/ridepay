var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017/';



execute = function (callback) {
    MongoClient.connect(url, function (err, client) {
        var db = client.db('ridepay');
        callback(err, db);
        //client.close();
    });
};

newObjectID = function (no) {
    var id;
    try {
        id = new ObjectID(no);
    } catch (err) {
        id=null;
    }
    return id;
};

exports.execute = execute;
exports.newObjectID = newObjectID;



