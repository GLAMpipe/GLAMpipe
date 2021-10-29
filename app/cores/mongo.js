const constants = require("../../config/const.js");
var schema 		= require('./../new_schema.js');
var mongoist 	= require("mongoist")

exports.query = async function (node) {

}


async function documentLoop(node, core) {

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
