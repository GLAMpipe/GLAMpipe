var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path        = require('path');
var mongoquery 	= require("../app/mongo-query.js");
var schema 		= require("../app/schema.js");
const database 	= require('../config/database');
var buildquery 	= require("../app/query-builder.js");
var db 			= mongojs(database.initDBConnect());

var exports = module.exports = {};


exports.getCount = function (req, cb) {
	
	//var query = createSearchQuery(req);
	var params = buildquery.search(req);
	//console.log(query)
	mongoquery.countDocs(req.params.collection, params.query, function (result) {
		cb({count:result});
	});
}


exports.getDocumentById = function (req, res) {

	console.log(req.params.doc);
	console.log(req.params.collection);
	mongoquery.findOneById(req.params.doc, req.params.collection, function(result) {
		console.log(result);
		res.json({data:result});
	})
}


exports.search = function (req, res) {

	var params = buildquery.search(req);

	mongoquery.findAll(params, function (result) {
		res.send({data:result});
	});
	
}

exports.getUsers = function(req, res) {
	mongoquery.findWithResultFields(
		{}
		, {"local.email":1}
		, "mp_users"
		, function(err, result) {
			if(!err)
				res.json(result);	
			else 
				return res.json([]);
	})
}

exports.getFields = function (query, collection, fields, cb) {

	mongoquery.findWithResultFields(
		query 
		, fields
		, collection
		, function(err, result) {
			if(!err)
				cb(result);	
			else 
				return cb([]);
	})
}

exports.getByField = function (req, res) {

	var query = {};
	query[req.query.field] = {$regex:req.query.value, $options: 'i'};
	
	exports.getCollection (req, query, res);
}

// TODO: update this
/**
 * Get paged collection data for DataTable
 * - gives records between skip and skip + limit
 */
exports.getTableData = function (req, res) {

	// create search query
	var query = buildquery.createSearchQuery(req);
	

	var limit = parseInt(req.query.limit);
	if (limit < 0 || isNaN(limit))
		limit = 15;

	var skip = parseInt(req.query.skip);
	if (skip <= 0 || isNaN(skip))
		skip = 0;

	var sort = req.query.sort
	if(typeof sort === 'undefined')  // by default sort by _id (mongoid)
		sort = "_id";

	var reverse = false
	var r = parseInt(req.query.reverse);
	if(!isNaN(r) && r == 1)  // reverse if reverse is 1
		reverse = true;

	var params = {
		collection: req.params.collection,
		query: query,
		limit: limit,
		skip: skip,
		sort: sort,
		reverse: reverse
	}
	mongoquery.findAll(params, function(data) { res.json({data:data}) });
}




// post with setter
exports.edit = function (req, callback) {

	var collection_id = req.params.collection
	console.log("COLLECTION: editing", collection_id,":",req.params.doc);
	console.log(req.body)
	if(!req.params.doc)
		return callback({error:"doc_id is missing!"});
		
	try {
		var doc_id = mongojs.ObjectId(req.params.doc)
	} catch (e) {
		return callback({error:"doc_id is invalid! It must be a valid MongoDB id."});
	}

	var keys = [];
	for(var key in req.body) {
		if(key != "doc_id") {
			keys.push(key);
			req.body.doc_id
		}
	}
	
	var setter = {};
	//setter[req.body.field] = req.body.value;
	setter["$set"] = req.body;
	
	// mark edited fields as manual edits
	if(req.query.manual)
		setter["$addToSet"] = {"_mp_manual":{$each:keys}};
	
	console.log(setter)
	
	mongoquery.update(collection_id, {_id:mongojs.ObjectId(req.params.doc)}, setter, function(err, result) {
		if(err) {
			console.log(err);
			return callback({error:err.message});
		} else {
			console.log(result);
			callback(result); 
		}
	});
}

// put with field-value pair
exports.edit2 = function (req, callback) {

	var collection_id = req.params.collection
	console.log("COLLECTION: field-value editing", collection_id,":",req.params.doc);
	if(!req.params.doc)
		return callback({error:"doc_id is missing!"});
		
	try {
		var doc_id = mongojs.ObjectId(req.params.doc)
	} catch (e) {
		return callback({error:"doc_id is invalid! It must be a valid MongoDB id."});
	}
	
	var setter = {};
    if(!req.body.field)
        return callback({error:"No update field defined!"});
        
	setter[req.body.field] = req.body.value;
	console.log("setter:", setter);
	
	mongoquery.update(collection_id, {_id:mongojs.ObjectId(req.params.doc)},{$set:setter}, function(err, result) {
		if(err) {
			console.log(err);
			return callback({error:err.message});
		} else {
			console.log(result);
			callback(result); 
		}
	});
}

exports.addToSet = function (collection_id, req, callback) {

	console.log("adding to set", collection_id);
	var setter = {};
	setter[req.body.field] = req.body.value;
	console.log("setter:", setter);
	
	mongoquery.update(collection_id, {_id:mongojs.ObjectId(req.body.doc_id)},{$addToSet:setter}, function(err, result) {
		callback(result); 
	});
}


exports.addDocument = function (req, callback) {

	mongoquery.insert(req.params.collection, req.body, function(error, result) {
		if(error) {
			console.log("ERROR: could not insert document!");
			callback(error);
		}
		else 
			callback(result);
	});
}


exports.deleteDocument = function (req, callback) {

	mongoquery.remove(req.params.doc, req.params.collection, function(error, result) {
		if(error) {
			console.log("ERROR: could not remove document! " + req.params.doc);
			callback(error);
		}
		else 
			callback(result);
	});
}


/**
 * Get paged collection data
 * - gives records between skip and skip + limit
 */
exports.getCollection = function (req, query, res) {

	var limit = parseInt(req.query.limit);
	if (limit < 0 || isNaN(limit))
		limit = 15;

	var skip = parseInt(req.query.skip);
	if (skip <= 0 || isNaN(skip))
		skip = 0;

	var sort = req.query.sort
	if(typeof sort === 'undefined')  // by default sort by _id (mongoid)
		sort = "_id";

	var reverse = false
	var r = parseInt(req.query.reverse);
	if(!isNaN(r) && r == 1)  // reverse if reverse is 1
		reverse = true;

	var params = {
		collection: req.params.collection,
		query: query,
		limit: limit,
		skip: skip,
		sort: sort,
		reverse: reverse
	}
	mongoquery.findAll(params, function(data) { res.json(data) });
}




exports.getCountRegExp = function (req, cb) {
	
	var query = buildquery.createSearchQuery(req);
	mongoquery.countDocs(req.params.collection, query, function (result) {
		cb({count:result});
	});
}


exports.getFacet = function (req, cb) {
	
	//var query = createSearchQuery(req);
	mongoquery.facet(req, function (result) {
		cb({count:result});
	});
}

exports.getFacetGroupBy = function (req, cb) {
	
	//var query = createSearchQuery(req);
	mongoquery.facetGroupBy(req, function (result) {
		cb({count:result});
	});
}


exports.getFacetTest = function (req, cb) {
	
	//var query = createSearchQuery(req);
	mongoquery.facetTest(req, function (result) {
		cb({count:result});
	});
}




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
