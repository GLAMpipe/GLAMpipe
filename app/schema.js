

var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path        = require('path');
var parseSchema = require('mongodb-schema');
var mongoquery 	= require("../app/mongo-query.js");
const database 	= require('../config/database');
var db 			= mongojs(database.initDBConnect());

var exports = module.exports = {};


/**
 * Iterate over all docs in collection
 * - required for API imports
 */

exports.createCollectionSchema = function (node, cb) {

  parseSchema(db.collection(node.collection).find(), {storeValues: false},function(err, schema) {
    if (err) return console.error(err);
 
    console.log(JSON.stringify(schema, null, 2));
    cb(schema)
    //db.close();
  });
	
}

exports.createCollectionSchema_old = function (node, cb) {
	//var collection = db.collection(collectionName);
	var key_list = {};
	var keys = [];

	db[node.collection].find(function (err, docs) {
		
		docs.forEach(function(doc) {
			for (key in doc) {
				if(keys.indexOf(key) < 0)
					keys.push(key);
			}
		})
		
		keys = keys.sort();
		
		// save schema
		var schema = {collection: node.collection, keys:keys}
		
		mongoquery.findOne({collection:node.collection}, "mp_schemas", function (error, doc) {
			if(doc) {
				mongoquery.remove(doc._id, "mp_schemas", function (error, doc) {
					console.log(error);
					mongoquery.insert("mp_schemas", schema, function(err, result) {
						if(cb)
							cb(result);
					})		
				})
			} else {
				mongoquery.insert("mp_schemas", schema, function(err, result) {
					if(cb)
						cb(result);
				})				
			}
		})
		
	})
}


exports.getCollectionSchema = function (collectionName, cb) {


		mongoquery.findOne({collection:collectionName}, "mp_schemas", function (error, doc) {
			if(error)
				cb([]);
			if(!doc)
				cb([]);
			else
				cb(doc);
		})
	


}
