

var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path        = require('path');
var mongoquery 	= require("../app/mongo-query.js");
const database 	= require('../config/database');
var db 			= mongojs(database.initDBConnect());

var exports = module.exports = {};


/**
 * Iterate over all docs in collection
 * - required for API imports
 */

exports.createCollectionSchema = function (node, cb) {
	//var collection = db.collection(collectionName);
	var key_list = {};
	var keys = [];

	db[node.collection].find(function (err, docs) {
		console.log(docs.length);
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
				mongoquery.updateSingle("mp_schemas", {collection:node.collection}, schema, function (error, doc) {
					
				})
			} else {
				mongoquery.insert("mp_schemas", schema, function(err, result) {
					//cb(result);
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
