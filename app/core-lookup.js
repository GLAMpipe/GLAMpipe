const vm 		= require("vm");
var db 			= require('./db.js');
var mongo 		= require('./cores/mongo.js');
const GP 		= require("../config/const.js");

var exports 	= module.exports = {};

exports.lookup = {

	'collection': {
		'mongoquery': async function(node) {
			await queryLoop(node, mongo.query);
		},
		
		'field_array': async function(node) {
			// get all lookup keys and values to be copied based on query created by init.js
			var collection = node.sandbox.context.node.params.required_source_collection;
			node.sandbox.core.data = await db[collection].find(node.sandbox.core.options.query, node.sandbox.core.options.options);
			await queryLoop(node)
		}
	}
}


// loop through documents
async function queryLoop(node, core) {

	//var bulk = db[node.collection].initializeOrderedBulkOp();
    const cursor = db[node.collection].findAsCursor({});	
	while(await cursor.hasNext()) {
		var doc = await cursor.next();
		node.sandbox.context.doc = doc;
		console.log(doc.julkaisunnimi)

		// PRE_RUN - give input to core (core.options)
		if(core) {
			node.sandbox.core.data = null;
			node.scripts.pre_run.runInContext(node.sandbox);
			node.sandbox.core.data = await core(node);
		}

		// run.js: must set setter!!!
		node.scripts.run.runInContext(node.sandbox);
		console.log("setter")
		console.log(node.sandbox.out.setter)
		
		if(node.sandbox.out.setter) {
			await db[node.collection].update({ '_id': doc._id }, {
				'$set': node.sandbox.out.setter
			});
		}
	}	
	// make changes to database
	//await bulk.execute();
}
