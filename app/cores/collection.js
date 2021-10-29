const constants = require("../../config/const.js");
var schema 		= require('./../new_schema.js');
var mongoist 	= require("mongoist")

exports.selectToCollection = async function (node) {

	// remove previous entries by this node
	var query = {};
	query[constants.source] = node.uuid;
	await global.db[node.collection].remove(query);

	query = {}
	const collection = node.source.params.required_source_collection
	var doc_id = node.settings.doc_id || '';
    const cursor = global.db[collection].findAsCursor(query);
	while(await cursor.hasNext()) {
		var doc = await cursor.next();
		node.sandbox.context.doc = doc;
		node.scripts.process.runInContext(node.sandbox);
		// write data
		if(node.sandbox.out.value) {
			markSourceNode(node.sandbox.out.value, node);
			await global.db[node.collection].insert(node.sandbox.out.value);
		}
	}
	await schema.createSchema(node.collection);
	node.scripts.finish.runInContext(node.sandbox);

}

function  markSourceNode(data, node) {
	if(Array.isArray(data)) {
		for(var d of data) {
			d[constants.source] = node.uuid;
		}
	} else {
		data[constants.source] = node.uuid
	}
}
