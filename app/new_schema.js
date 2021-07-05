
var project 	= require('./new_project.js');


var exports = module.exports = {};



exports.init = async function (collection_name) {

	var schema = {collection: collection_name, keys:[]}
	await global.db["gp_schemas"].insert(schema);
	console.log("SCHEMA: schema created for "+collection_name);

}



/**
 * Iterate over all docs in collection
 * - required for API imports
 */

exports.createSchema = async function (collection_name) {

	var keys = [];
    const cursor = global.db[collection_name].findAsCursor({});

	while(await cursor.hasNext()) {
		var doc = await cursor.next();
		for (key in doc) {
			if(keys.indexOf(key) < 0) {
				keys.push(key);
			}
		}
	}

	keys = keys.sort();
	var schema = {collection: collection_name, keys:keys}
	await save(collection_name, schema);
	console.log("SCHEMA: schema created for "+collection_name+ " (" + keys.length + " keys)");

}

/**
 * Add new keys to schema
 */

exports.update = async function(collection_name, doc) {

	var keys = [];
	for (key in doc) {
		keys.push(key);
	}
	await global.db["gp_schemas"].update({collection: collection_name}, {$addToSet: {keys: {$each: keys}}});
}

exports.getSchema = async function (collection_name) {

	var schema = await global.db["gp_schemas"].findOne({'collection':collection_name});
	// add keys that are set via "out.setter" dynamically to the schema
	if(schema && schema.keys) {
		var nodes = await global.db["gp_nodes"].find({"collection": collection_name});
		for(var node of nodes) {
			if(node.schema && node.collection === collection_name) {
				for(var key in node.schema) {
					schema.keys.push(key);
				}
			}
		}
	}
	schema.keys.sort()
	return schema;
}



exports.removeKeysFromSchema = function(collectionName, keys, cb) {

	// TODO: tee tämä
	var query = {};
	query["$unset"] = keys;
	mongoquery.updateAll(collectionName, query, function (error) {
		if(error)
			console.log(error);
		else
			console.log("DB: keys removed", node.collection);
		callback(error);
	});
}



async function save(collection_name, schema) {

	await global.db["gp_schemas"].remove({'collection': collection_name});
	await global.db["gp_schemas"].insert(schema);

}
