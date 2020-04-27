
const mongoist 	= require('mongoist');
const util 		= require('util');

var buildquery 	= require('../app/query-builder.js');
const MP 		= require('../config/const.js');
const schema 	= require('./new_schema.js');
var debug 		= require('debug')('GLAMpipe');
var error 		= require('debug')('error');
var path 		= require('path');



exports.create = async function(collection_name, project) {
	
	const fs = require('fs').promises;

	// cleanup and generate collection name
	var mongo_name = collection_name.replace(/[^a-z0-9-]/g,"");
	mongo_name = project.dir + "_c" + project.collection_count + "_" + collection_name;  // unique name for collection
	await global.db['gp_projects'].update({_id:project._id}, {$inc: { 'collection_count': 1}, $addToSet: {collections: {name:mongo_name, title:collection_name }} })

	await global.db.createCollection(mongo_name);
	// write collection directory under project directory
	var collection_dir = path.join(config.dataPath, 'projects', project.dir, mongo_name);
	try{ await fs.mkdir(collection_dir) } catch(e) { debug("Collection directory exists", e) }
	try{ await fs.mkdir(path.join(collection_dir, 'source')) } catch(e) { debug("Collection directory exists", e) }
	try{ await fs.mkdir(path.join(collection_dir, 'process')) } catch(e) { debug("Collection directory exists", e) }
	try{ await fs.mkdir(path.join(collection_dir, 'export')) } catch(e) { debug("Collection directory exists", e) }
	try{ await fs.mkdir(path.join(collection_dir, 'view')) } catch(e) { debug("Collection directory exists", e) }
	try{ await fs.mkdir(path.join(collection_dir, 'tmp')) } catch(e) { debug("Collection directory exists", e) }
	
	await schema.init(mongo_name);
	
	return collection_name;

}

exports.removeFromProject = async function(collection_name) {
	
	var project = await exports.getProject(collection_name);
	// remove collection from project data
	await global.db['gp_projects'].update(
		{_id:project._id}, 
		{'$pull': 
			{'collections': {'name':collection_name}}
		}
	);

	// when collection is dropped, we must also remove all nodes attached to it
	await global.db['gp_nodes'].remove({'collection': collection_name});
	
	// drop collection
	await global.db[collection_name].drop();
	
	// remove collection from schema data
	await global.db["gp_schemas"].remove({'collection':collection_name});
	
	// remove collection directories from data dir
	//rimraf(node.dir, callback);
}

exports.getFields = async function(collection_name) {
	
	return await schema.getShema(collection_name);
	
}

exports.getDoc = async function(collection_name, id) {
	
	try {
		return await global.db[collection_name].findOne({_id:mongoist.ObjectId(id)});
	} catch(e) {
		return {};
	}
}



exports.getDocs = async function(collection_name, query) {
	
	// create search query
	var search = buildquery.search(query);
	debug(JSON.stringify(search))

	var total = await global.db[collection_name].findAsCursor(
		search.query, 
		search.keys
	  ).count();

	var result = {total: total, data: []}

	result.data = await global.db[collection_name].findAsCursor(
		search.query, 
		search.keys
	  ).sort(search.sort).skip(search.skip).limit(search.limit).toArray();
	  
	return result;
	
}

exports.insertDoc = async function(collection_name, doc) {

	try {
		var d = await global.db[collection_name].insert(doc);
		await schema.update(collection_name,doc)
		return d;
	} catch(e) {
		error(e)
		throw("Document insert failed: ", e)
	}
}

exports.updateDoc = async function(collection_name, doc_id, data) {
	try {
		await global.db[collection_name].update({"_id": mongoist.ObjectId(doc_id)},{$set: data});
	} catch(e) {
		error(e)
		throw("Document update failed: ", e)
	}
}


exports.removeDoc = async function(collection_name, id) {
	
	try {
		await global.db[collection_name].remove({_id:mongoist.ObjectId(id)});
	} catch(e) {
		error(e)
		throw("Could not delete document ", id)
	}
}

exports.getCount = async function(collection_name, query) {
	var search = buildquery.search(query);
	return await global.db[collection_name].count(search.query);
}

exports.getProject = async function(collection_name) {
	var query = {'collections.name': collection_name}
	var project = await global.db.collection('gp_projects').findOne(query);
	return project;
}

exports.getKeyTypes = async function (collection_name, cb) {
	var self = this;
	var key_list = {};
	
	// first we take the first record and extract key names from that
	var doc = await global.db.collection(collection_name).findOne({});
	for (key in doc) {
		if(Array.isArray(doc[key]))
			key_list[key]= "array";
		else
			key_list[key] = typeof doc[key];
			
	}
	return key_list;
}

exports.facet = async function (req) {

	var filters = [];
	var collection = global.db.collection(req.params.collection);
	var fields = req.query.fields.split("|").map(function(item) {
		return item.trim();
	});
	var filters = [];
	var skip = ["skip", "limit", "sort", "reverse", "op", "fields", "bucket"]; 
	var bucket = [req.query.bucket];
	var operators = buildquery.operators(req);
	const AS_ARRAY = true;
	var filters = buildquery.filters(req, operators, skip, AS_ARRAY);

	const fieldTypes = await exports.getKeyTypes(req.params.collection);
	var aggr = buildAggregate(fields, fieldTypes, filters, bucket);
	console.log(aggr)
	return await collection.aggregate(aggr);

}

function buildAggregate (fields, fieldTypes, filters, bucket) {

	var aggregate = [];
	var facets =  { $facet: {}};
	// build aggregate
	if(filters.length) {
		aggregate.push({$match: {$and:filters}});
	}
	aggregate.push(facets);

	// generate facets
	fields.forEach(function(field) {
		var facet = [];
		if(fieldTypes[field] === "array") {
			facet.push({ $unwind: "$" + field });
		}
		
		// facet by first character + all entries
		if(bucket.includes(field)) {
			// group by field & sort by count
			facet.push({ $group: {_id: "$" + field, grouped: {$first: "$" + field}, count: {$sum: 1}}});
			facet.push({ $sort: { _id : 1 }});
			// group by first character & sort alphabetically
			facet.push({ $group: {_id: {$substrCP: ["$grouped", 0, 1]}, count: {$sum: 1}, entries: {$push: {id:"$grouped", count: "$count"} } }});
			facet.push({ $sort: { _id : 1 }});

		// facet by count
		} else {
			facet.push({ $group: {_id: "$" + field, count: {$sum: 1}}});
			facet.push({ $sort: { count : -1 }});
			facet.push({ $limit: 100 }); // just in case
		}
		
		facets["$facet"][field] = facet;
	})

	console.log("AGGREGATE:\n" + util.inspect(aggregate, false, null, true));
	//console.log("\n");
	return aggregate;
}


function aggregate (collection, aggregate, callback) {

	//console.log(JSON.stringify(aggregate, null, 2));
	collection.aggregate(
		aggregate
		,
		function (err, data) {
			if(err) {
				console.log("field is NOT an array");
				console.log(err);
				callback(data);

			} else {
				callback(data);
			}
		}
	) 
}


