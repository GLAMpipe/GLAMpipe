
var requestPromise 	= require('request-promise-native');
var debug 			= require('debug')('GLAMpipe:node');
var db 				= require('../db.js');
const constants 	= require("../../config/const.js");

exports.postJSON = async function (options) {
	
	//node.sandbox.core.options.resolveWithFullResponse = true;
	var result = await requestPromise(options);
	return result;
}



exports.getAndSaveFile = async function(node) {
	// download file
	console.log(node.sandbox.core.options)
	try {
		var result = await requestPromise(node.sandbox.core.options);
		console.log(result.statusCode)
	} catch(e) {
		console.log(e.message)
		throw("Fetch failed")
	}
	// save to node directory
	const fs = require("fs");
	fs.writeFileSync(node.sandbox.core.filename, result, 'utf-8')
}



exports.getJSON = async function (node) {
	
	debug("REQUEST:", node.sandbox.core.options.method + " -> " + node.sandbox.core.options.url);

	// remove previous entries by this node
	var query = {}; 
	query[constants.source] = node.uuid;
	await db[node.collection].remove(query);

	if(node.sandbox.core.options.headers) 
		node.sandbox.core.options.headers.Accept = "application/json";
	else
		node.sandbox.core.options.headers = {Accept: "application/json"};
									
	// we want statuscode	
	node.sandbox.core.options.resolveWithFullResponse = true;
		
	while(node.sandbox.core.options.url) {

		console.log(node.sandbox.core.options)
		try {
			var result = await requestPromise(node.sandbox.core.options);
			node.sandbox.core.response = result;
			node.sandbox.core.data = JSON.parse(result.body);

			node.sandbox.core.options.url = null; // reset url
			node.sandbox.core.error = null; // reset error
			

		// if request failes, then we pass error to node script so that it can decide what to do
		} catch(e) {
			node.sandbox.core.response = result;
			node.sandbox.core.error = e.message;
			console.log('ERROR: ' + e.message);
			node.sandbox.core.options.url = null;
		}

		// handle data and get new options
		try {
			node.scripts.run.runInContext(node.sandbox);
		} catch(e) {
			console.log(e)
		}

		// write data
		if(node.sandbox.out.value) {
			markSourceNode(node.sandbox.out.value, node);
			await db[node.collection].insert(node.sandbox.out.value);
		}
	}
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
