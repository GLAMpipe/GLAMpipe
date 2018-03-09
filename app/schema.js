

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
	//var collection = db.collection(collectionName);
	var key_list = {};
	var keys = [];
	
	var cursor = mongoquery.find2({}, node.collection);
	generateSchema(node, cursor, keys);
	

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



function saveSchema(new_schema, node, cb) {
	mongoquery.findOne({collection:node.collection}, "mp_schemas", function (error, old_schema) {
		if(old_schema) {
			mongoquery.remove(old_schema._id, "mp_schemas", function (error, doc) {
				mongoquery.insert("mp_schemas", new_schema, function(err, result) {
					if(cb)
						cb(result);
				})		
			})
		} else {
			mongoquery.insert("mp_schemas", new_schema, function(err, result) {
				if(cb)
					cb(result);
			})				
		}
	})
}

function generateSchema(node, cursor, keys, cb) {
	
	cursor.next(function(err, doc) {

		for (key in doc) {
			if(keys.indexOf(key) < 0) {
				keys.push(key);
			}
		}
		// quit if there are no more documents
		if(!doc) {
			keys = keys.sort();
			// save schema
			var schema = {collection: node.collection, keys:keys}
			saveSchema(schema, node);
			console.log("COLLECTION: schema created (" + keys.length + " keys)");
			return;
		}
		
		generateSchema(node, cursor, keys);
	})
}



