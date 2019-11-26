
var db 			= require('./db.js');
var project 	= require('./new_project.js');


var exports = module.exports = {};


/**
 * Iterate over all docs in collection
 * - required for API imports
 */

exports.createSchema = async function (collection_name) {

	var keys = [];
    const cursor = db[collection_name].findAsCursor({});	
    
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



exports.getSchema = async function (collection_name) {

	var schema = await db["gp_schemas"].findOne({'collection':collection_name});
	// add keys that are set via "out.setter" dynamically to the schema
	if(schema && schema.keys) {
		var proj = await project.getProjectByCollection(collection_name);
		for(var node of proj.nodes) {
			if(node.schema && node.collection === collection_name) {
				for(var key in node.schema) {

					schema.keys.push(key);
				}
			}
		}
	}
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
	
	await db["gp_schemas"].remove({'collection': collection_name});
	await db["gp_schemas"].insert(schema);

}





