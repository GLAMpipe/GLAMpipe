
const mongoist 	= require('mongoist');

var db 			= require('./db.js');
var buildquery 	= require('../app/query-builder.js');
const MP 		= require('../config/const.js');



exports.create = async function(collection_name, project) {

	// cleanup and generate collection name
	collection_name = collection_name.replace(/[^a-z0-9-]/g,"");
	collection_name = project.prefix + "_c" + project.collection_count + "_" + collection_name;
	await db['mp_projects'].update({_id:mongoist.ObjectId(project._id)}, {$inc: { 'collection_count': 1, 'node_count': 1}, $addToSet: {collections: [collection_name] } })

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

	var sort = params.sort
	if(typeof sort === 'undefined')  // by default sort by _id (mongoid)
		sort = "_id";

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

	var reverse = false
	var r = parseInt(params.reverse);
	if(!isNaN(r) && r == 1)  // reverse if reverse is 1
		reverse = true;

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
		{}, 
		keys
	  ).sort({'_id': -1}).limit(2).toArray();
	
	//return await db[collection_name].find({}).limit(2);
	
}
