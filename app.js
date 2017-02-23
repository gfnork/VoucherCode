var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var used = [];
var morgan = require('morgan')
var app = express();
var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');
var url = 'mongodb://skipq-codes:DQYAp4Wa@ds161039.mlab.com:61039/skipq-codes';
//start server
var server_port = process.env.port || process.env.OPENSHIFT_NODEJS_PORT || 3002;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

MongoClient.connect(url, function (err, db) {
  var codeCollection = db.collection('codes');
  assert.equal(null, err);
  console.log("Connected correctly to mongodb server");
  app.use(morgan('combined'));
  app.use(cors());
  app.use(bodyParser.json());

  app.get('/valid', function (req, res) {
    codeCollection.find({valid: true}, {code: 1, valid: 1, _id: 0})
      .toArray()
      .then(function (result) {
        res.send(result);
      });
  });

  app.get('/used', function (req, res) {
    codeCollection.find({valid: false}, {code: 1, valid: 1, _id: 0})
      .toArray()
      .then(function (result) {
        res.send(result);
      });
  });

  app.get('/create', function (req, res) {
    var codes = [];
    //generate codes
    for (var i = 0; i < 1000; i++) {
      codes.push(generateCode());
    }
    // Insert some documents
    codeCollection.insertMany(codes)
      .then(function (result) {
        res.send(result)
      });
  });

  app.post('/check', function (req, res) {
    var code = req.body.code;
    codeCollection.findOne({code: code}, {code: 1, valid: 1, _id: 0})
      .then(function (result) {
        if (result) {
          if (result.valid) {
            return codeCollection.updateOne({code: code}, {$set: {valid: false}});
          } else {
            throw new Error('code already used');
          }
        } else {
          throw new Error('code is invalid');
        }
      })
      .then(function (result) {
        console.log(result);
        res.json({message: 'code is valid', valid: true});
      })
      .catch(function (err) {
        res.json({message: err.message, valid: false});
      });
  });

  function generateCode() {
    return {code: Math.random().toString(36).substring(2, 7), valid: true};
  }

  app.listen(server_port, server_ip_address, function () {
    console.log("Listening on " + server_ip_address + ", server_port " + server_port);

    //codes.forEach(function(code) {
    //    console.log(code);
    //});
  });

  //db.close();
});
