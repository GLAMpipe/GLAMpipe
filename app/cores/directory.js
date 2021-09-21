
var readdir   = require('recursive-readdir');
const fs = require('fs')
const fsPromises = fs.promises;
var schema 			= require('./../new_schema.js');
const constants 	= require("../../config/const.js");

exports.scan = async function  (node) {

	var query = {};
	query[constants.source] = node.uuid;
	await global.db[node.collection].remove(query);

	var data = await readdir('/home/arihayri/Downloads/Jyvaskylan_kesa_digitoitu')
	console.log(data)
	node.sandbox.core.data = []
	for(var file of data) {
		var stats = await fsPromises.stat(file)
		var f = {
			file: file,
			size: stats["size"],
			ctime: stats["ctime"]
		}
		node.sandbox.core.data = f;
		try {
			node.scripts.process.runInContext(node.sandbox);
		} catch(e) {
			console.log(e)
		}
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
