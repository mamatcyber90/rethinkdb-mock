// Generated by CoffeeScript 1.12.4
var Database, Query, Table, assertType, cache, rethinkdb, setProto, utils;

assertType = require("assertType");

setProto = require("setProto");

Database = require("./Database");

Table = require("./Table");

Query = require("./Query");

utils = require("./utils");

setProto(require("./Result").prototype, Query.prototype);

utils.isQuery = utils.isQuery.bind(null, [Query, Table]);

cache = Object.create(null);

rethinkdb = function(options) {
  var db, name;
  if (options == null) {
    options = {};
  }
  assertType(options, Object);
  name = options.name || "test";
  if (db = cache[name]) {
    return db;
  }
  db = Database(name);
  cache[name] = db;
  return db;
};

module.exports = rethinkdb;