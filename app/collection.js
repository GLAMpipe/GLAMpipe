var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path        = require('path');
var mongoquery 	= require("../app/mongo-query.js");


var exports = module.exports = {};


/**
 * Get collection fields
 * - combines keys from first document and possible schema (written by import node)
 */
exports.getKeys = function (collection_name, cb) {
	var self = this;
	var key_list = {};
	
	// first we take the first record and extract key names from that
	mongoquery.findOne({}, collection_name, function(err, doc) {
		for (key in doc) {
			key_list[key] = {};
		}
		//console.log(doc);
		// then we look for schema and apply that top of list of keys 
		mongoquery.findOneProjection({"schemas.collection": collection_name}, {"schemas.$":1},  "mp_projects", function(project) {
			if(project && project.schemas && project.schemas.length) {
				for (var i = 0; i <  project.schemas[0].keys.length; i++) {
					var type = project.schemas[0].types[i];
					key_list[project.schemas[0].keys[i]] = {"type":type};
				}
				
			}
			var data_arr = [];
			var key_arr = Object.keys(key_list).sort();
			for (var i = 0; i < key_arr; i++) {
				data_sorted.push(data[key_arr[i]]);
			}
			cb({keys:key_list, sorted:key_arr});
			
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

