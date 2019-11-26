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

	if(node.sandbox.core.login) {
		node.sandbox.core.login.jar = true;
		debug("Logging in: " + node.sandbox.core.login.url)
		await requestPromise(node.sandbox.core.login);
	}

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
	node.sandbox.core.options.jar = true;
		
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



exports.lookupJSON = async function (node) {

	if(node.sandbox.core.login) {
		node.sandbox.core.login.jar = true;
		debug("Logging in: " + node.sandbox.core.login.url)
		await requestPromise(node.sandbox.core.login);
	}

	var bulk = db[node.collection].initializeUnorderedBulkOp();

    const cursor = db[node.collection].findAsCursor({});	
	while(await cursor.hasNext()) {
		var doc = await cursor.next();
	  
		node.sandbox.context.doc = doc;
		node.sandbox.core.data = [];
		node.sandbox.core.response = [];
		node.sandbox.out.value = '';

		// PRE_RUN - create options for web request
		node.scripts.pre_run.runInContext(node.sandbox);
		
		// CALL CORE - if there are several options, then make request for every row
		if(Array.isArray(node.sandbox.core.options)) {
			var results = []
			for(var options of node.sandbox.core.options) {
				debug("REQUEST:", options.method + " -> " + options.url);
				options.resolveWithFullResponse = true; // we want full response
				options.jar = true;
				var result = await requestPromise(options);
				results.push(result);
			}
			node.sandbox.core.response = results;
		} else {
			debug("REQUEST:", node.sandbox.core.options.method + " -> " + node.sandbox.core.options.url);
			node.sandbox.core.options.resolveWithFullResponse = true;
			node.sandbox.core.options.jar = true;
			node.sandbox.core.response = await requestPromise(node.sandbox.core.options)
		}	

		// process results
		node.scripts.run.runInContext(node.sandbox);
		
		// write outcome
		var setter = {}
		setter[node.source.params.out_field] = node.sandbox.out.value;
		bulk.find({ '_id': doc._id }).updateOne({
			'$set': setter
		});
	}	
	
	// make changes to database
	await bulk.execute();
	
	// notify that we are finished
	//node.sandbox.out.say('finish', 'Done');
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
