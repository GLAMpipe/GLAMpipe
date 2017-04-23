var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path        = require('path');
var mongoquery 	= require("../app/mongo-query.js");
var schema 		= require("../app/schema.js");
const database 	= require('../config/database');
var db 			= mongojs(database.initDBConnect());

var exports = module.exports = {};


/**
 * Get collection fields
 * - combines keys from first document and possible schema (written by import node)
 */
exports.getKeys = function (collection_name, cb) {
	var self = this;
	var key_list = {};
	var all_keys = [];
	var source_keys = [];
	var node_keys = []


	
	// all keys that are not in schema are node output fields
	mongoquery.findOne({collection:collection_name}, "mp_schemas", function(err, doc) {
		if(doc) {
			all_keys = doc.keys;
		
		}
		
		// first we take the first record and extract key names from that
		mongoquery.findOne({}, collection_name, function(err, doc) {
			for (key in doc) {
				
				if(all_keys.indexOf(key) < 0) {
					node_keys.push(key);
					all_keys.push(key);
				}
				key_list[key] = {};
			}

		cb({node_keys:node_keys,keys:key_list, sorted:all_keys.sort()});
		
		})		
		
	})
	

}

/**
 * Get collection fields + types (array, string)
 * - combines keys from first document
 */
exports.getKeyTypes = function (collection_name, cb) {
	var self = this;
	var key_list = {};
	
	// first we take the first record and extract key names from that
	mongoquery.findOne({}, collection_name, function(err, doc) {
		for (key in doc) {
			if(Array.isArray(doc[key]))
				key_list[key]= "array";
			else
				key_list[key] = typeof doc[key];
				
		}
		//console.log(doc);
		cb(key_list);
	
	})
}

exports.getSchema = function (collection_name, cb) {
	schema.getCollectionSchema(collection_name, cb);
}
