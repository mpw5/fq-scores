// This is a library file implementing functions for storing and working with data in your MongoDB.

"use strict";

var mongodb = require('mongodb');
// Standard URI format: mongodb+srv://dbuser:dbpassword@host/dbname?retryWrites=true&w=majority, details set in .env
// eg mongodb+srv://mpw5:<password>@fq-scores-test.yofhx.mongodb.net/fq-scores-test?retryWrites=true&w=majority
var MONGODB_URI = 'mongodb+srv://' + process.env.USERNAME + ':' + process.env.PASS + '@' + process.env.HOST + '/' + process.env.DB + '?' + process.env.DB_PARAMS;
var collection;

// ------------------------------
// ASYNCHRONOUS PROMISE-BASED API
// ------------------------------

// Serializes an object to JSON and stores it to the database
function setScore(key, value) {
  return new Promise(function(resolve, reject) {
    if (typeof(key) !== "string") {
      reject(new DatastoreKeyNeedToBeStringException(key));
    } else {
      try {
        var serializedValue = JSON.stringify(value);
        collection.updateOne({
          "name": key
        }, {
          $set: {
            "score": Number(serializedValue)
          }
        }, {
          upsert: true
        }, function(err, res) {
          if (err) {
            reject(new DatastoreUnderlyingException(value, err));
          } else {
            resolve(res);
          }
        });
      } catch (ex) {
        reject(new DatastoreValueSerializationException(value, ex));
      }
    }
  });
}

// Serializes an object to JSON and stores it to the database
function setEmoji(key, value) {
  return new Promise(function(resolve, reject) {
    if (typeof(key) !== "string") {
      reject(new DatastoreKeyNeedToBeStringException(key));
    } else {
      try {
        var serializedValue = JSON.stringify(value);
        collection.updateOne({
          "name": key
        }, {
          $push: {
            emojis: [value]
          }
        }, {
          upsert: true
        }, function(err, res) {
          if (err) {
            reject(new DatastoreUnderlyingException(value, err));
          } else {
            resolve(res);
          }
        });
      } catch (ex) {
        reject(new DatastoreValueSerializationException(value, ex));
      }
    }
  });
}

// Get all records from db, sorted by score
function getAll(callback) {
  try {
    //Find all documents in the collection:

    collection.find({}).sort({
      score: -1
    }).toArray(function(err, result) {
      if (err) throw err;

      callback(result);
    });

  } catch (ex) {
    console.log("Error getting results from db");
  }
}


// Fetches an object from the database, deserializing it from JSON
function get(key) {
  return new Promise(function(resolve, reject) {
    try {
      if (typeof(key) !== "string") {
        reject(new DatastoreKeyNeedToBeStringException(key));
      } else {
        collection.findOne({
          "name": key
        }, function(err, data) {
          if (err) {
            reject(new DatastoreUnderlyingException(key, err));
          } else {
            try {
              if (data === null) {
                resolve(null);
              } else {
                resolve(JSON.parse(data.score));
              }
            } catch (ex) {
              reject(new DatastoreDataParsingException(data.score, ex));
            }
          }
        });
      }
    } catch (ex) {
      reject(new DatastoreUnknownException("get", {
        "key": key
      }, ex));
    }
  });
}

function remove(key) {
  return new Promise(function(resolve, reject) {
    try {
      if (typeof(key) !== "string") {
        reject(new DatastoreKeyNeedToBeStringException(key));
      } else {
        collection.deleteOne({
          "key": key
        }, function(err, res) {
          if (err) {
            reject(new DatastoreUnderlyingException(key, err));
          } else {
            resolve(res);
          }
        });
      }
    } catch (ex) {
      reject(new DatastoreUnknownException("remove", {
        "key": key
      }, ex));
    }
  });
}

function removeMany(keys) {
  return Promise.all(keys.map(function(key) {
    return remove(key);
  }));
}

function connect() {
  return new Promise(function(resolve, reject) {
    try {
      mongodb.MongoClient.connect(MONGODB_URI, { useNewUrlParser: true }, function(err, db) {
        if (err) reject(err);

        const myDb = db.db(process.env.DB);

        collection = myDb.collection(process.env.COLLECTION);
        resolve(collection);
      });
    } catch (ex) {
      reject(new DatastoreUnknownException("connect", null, ex));
    }
  });
}

function DatastoreKeyNeedToBeStringException(keyObject) {
  this.type = this.constructor.name;
  this.description = "Datastore can only use strings as keys, got " + keyObject.constructor.name + " instead.";
  this.key = keyObject;
}

function DatastoreValueSerializationException(value, ex) {
  this.type = this.constructor.name;
  this.description = "Failed to serialize the value to JSON";
  this.value = value;
  this.error = ex;
}

function DatastoreDataParsingException(data, ex) {
  this.type = this.constructor.name;
  this.description = "Failed to deserialize object from JSON";
  this.data = data;
  this.error = ex;
}

function DatastoreUnderlyingException(params, ex) {
  this.type = this.constructor.name;
  this.description = "The underlying DynamoDB instance returned an error";
  this.params = params;
  this.error = ex;
}

function DatastoreUnknownException(method, args, ex) {
  this.type = this.constructor.name;
  this.description = "An unknown error happened during the operation " + method;
  this.method = method;
  this.args = args;
  this.error = ex;
}

var asyncDatastore = {
  setScore: setScore,
  setEmoji: setEmoji,
  get: get,
  getAll: getAll,
  remove: remove,
  removeMany: removeMany,
  connect: connect
};

module.exports = {
  async: asyncDatastore
};
