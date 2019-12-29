const vm 		= require("vm");
var mongoist 	= require("mongoist")
var pdf 		= require('./cores/pdf.js');
const GP 		= require("../config/const.js");

var exports 	= module.exports = {};

exports.process = {

	'collection': {
		'index': async function(node) {
			var field = {};
			field[node.source.params.in_field] = 1;
			var r = await global.db[node.collection].createIndex(field);
			node.scripts.finish.runInContext(node.sandbox);
		},
		
		'remove': async function(node) {
			await deleteLoop(node);
		},
	}
}



// loop through documents
async function deleteLoop(node) {

    const cursor = global.db[node.collection].findAsCursor({});	
	while(await cursor.hasNext()) {
		var doc = await cursor.next();
		node.sandbox.context.doc = doc;
		node.scripts.run.runInContext(node.sandbox);
		if(node.sandbox.out.value) {
			console.log("removing "+ doc._id);
			await global.db[node.collection].remove({ '_id': doc._id });
		}
	}	
}
