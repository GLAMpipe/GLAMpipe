const vm 		= require("vm");
var mongoist 	= require("mongoist")
var mongo 		= require('./cores/mongo.js');
var web 		= require('./cores/web.js');
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
			node.sandbox.core.data = await global.db[collection].find(node.sandbox.core.options.query, node.sandbox.core.options.options);
			await queryLoop(node)
		}
	},
	'web': {
		'JSON': async function(node) {
			try {
				await web.lookupJSON(node)
			} catch(e) {
				console.log(e);
			}
		},
		'head': async function(node) {
			try {
				await web.lookupJSON(node)
			} catch(e) {
				console.log(e);
			}
		},
	}
}


// loop through documents
async function queryLoop(node, core) {

	var query = {}
	var doc_id = node.settings.doc_id || '';
	if(doc_id) query = {"_id": mongoist.ObjectId(doc_id)}; // single run
    const cursor = global.db[node.collection].findAsCursor(query);
	while(await cursor.hasNext()) {
		var doc = await cursor.next();
		node.sandbox.context.doc = doc;

		// OPTIONS - give input to core (core.options)
		if(core) {
			node.sandbox.core.data = null;
			node.scripts.options.runInContext(node.sandbox);
			node.sandbox.core.data = await core(node);
		}

		// run.js: must set setter!!!
		console.log(node.scripts)
		node.scripts.process.runInContext(node.sandbox);
		console.log("setter")
		console.log(node.sandbox.out.setter)

		if(node.sandbox.out.setter) {
			await global.db[node.collection].update({ '_id': doc._id }, {
				'$set': node.sandbox.out.setter
			});
		}
	}
	// make changes to database
	//await bulk.execute();
}
