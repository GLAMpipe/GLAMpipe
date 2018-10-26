
const mongoist 	= require('mongoist');

var db 			= require('./db.js');
var buildquery 	= require('../app/query-builder.js');
const MP 		= require('../config/const.js');



exports.create = async function(collection_name, project) {

	// cleanup and generate collection name
	collection_name = collection_name.replace(/[^a-z0-9-]/g,"");
	collection_name = project.prefix + "_c" + project.collection_count + "_" + collection_name;
	await db['mp_projects'].update({_id:mongoist.ObjectId(project._id)}, {$inc: { 'collection_count': 1, 'node_count': 1}, $addToSet: {collections: collection_name } })

	await db.createCollection(collection_name);
	return collection_name;

}


exports.getFields = async function(collection_name) {
	
	return await schema.getShema(collection_name);
	
}


exports.getDocs = async function(collection_name, params) {
	
	// create search query
	var query = buildquery.createSearchQuery(params);

	var limit = parseInt(params.limit);
	if (limit < 0 || isNaN(limit))
		limit = 15;

	var skip = parseInt(params.skip);
	if (skip <= 0 || isNaN(skip))
		skip = 0;

	var sort_key = params.sort
	if(typeof sort_key === 'undefined')  // by default sort by _id (mongoid)
		sort_key = "_id";

	// keys that are wanted
	var keys = {};
	if(typeof params.keys !== 'undefined') {
		arrKeys = params.keys.split(",");
		arrKeys.forEach((key) => {
			keys[key.trim()] = 1;
		})
	}

	// keys that are not wanted
	if(typeof params.nokeys !== 'undefined') {
		arrKeys = params.nokeys.split(",");
		arrKeys.forEach((key) => {
			keys[key.trim()] = 0;
		})
	}

	var reverse = 1
	var r = parseInt(params.reverse);
	if(!isNaN(r) && r == 1)  // reverse if reverse is 1
		reverse = -1;

	sort = {};
	sort[sort_key] = reverse;

	var params = {
		collection: collection_name,
		query: query,
		keys: keys,
		limit: limit,
		skip: skip,
		sort: sort,
		reverse: reverse
	}
	console.log(params);



	return await db[collection_name].findAsCursor(
		query, 
		keys
	  ).sort(sort).skip(skip).limit(limit).toArray();
	
	//return await db[collection_name].find({}).limit(2);
	
}

exports.getCount = async function(collection_name, params) {
	return await db[collection_name].count({});
}


exports.getKeyTypes = async function (collection_name, cb) {
	var self = this;
	var key_list = {};
	
	// first we take the first record and extract key names from that
	var doc = await db.collection(collection_name).findOne({});
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
	var collection = db.collection(req.params.collection);
	var fields = req.query.fields.split(",").map(function(item) {
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

	//console.log("AGGREGATE:\n" + util.inspect(aggregate, false, null, true));
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

