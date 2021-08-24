var axios 			= require('axios');
const axiosCookieJarSupport = require('axios-cookiejar-support').default
const tough			= require('tough-cookie');
var path 			= require('path');
var mongoist 		= require("mongoist")
var debug 			= require('debug')('GLAMpipe:node');
var error 			= require('debug')('ERROR');
var schema 			= require('./../new_schema.js');
const constants 	= require("../../config/const.js");

axiosCookieJarSupport(axios);

exports.sendJSON = async function (node) {

	console.log("calling core")

	// OPTIONS.JS - give input to core (core.options)
	try {
		node.scripts.options.runInContext(node.sandbox);
	} catch(e) {
		//error(e)
		throw(e)
	}

	setAcceptHeaders(node, "application/json")

	// actual request
	try {
		node.sandbox.core.options.withCredentials = true
		node.sandbox.core.options.jar = node.sandbox.core.login.jar
		debug(node.sandbox.core.options)
		var result = await axios(node.sandbox.core.options);
		debug(result.data)
		node.sandbox.core.response = result
		node.sandbox.core.data = result.data;
	} catch(e) {
		throw(e);
	}
}



exports.getAndSaveFile = async function(node) {
	// download file
	try {
		var result = await axios(node.sandbox.core.options);
	} catch(e) {
		console.log(e)
		throw("Fetch failed: " + e.response.status)
	}
	// save to node directory
	const fs = require("fs-extra");
	var file = path.join(node.source.project_dir, "files", node.sandbox.core.filename);
	debug("writing file " + file)
	await fs.writeFile(file, result.data, 'utf-8')
}

exports.getJSON = async function (node) {

	const cookieJar = new tough.CookieJar();
	if(node.sandbox.core.login) {
		node.sandbox.core.login.jar = cookieJar
		node.sandbox.core.login.withCredentials = true
		debug("Logging in: " + node.sandbox.core.login.url)
		await axios(node.sandbox.core.login);
	} else {
		debug('No credentials given, no login')
	}

	debug("REQUEST:", node.sandbox.core.options.method + " -> " + node.sandbox.core.options.url);
	// remove previous entries by this node
	var query = {};
	query[constants.source] = node.uuid;
	await global.db[node.collection].remove(query);

	if(node.sandbox.core.options.headers)
		node.sandbox.core.options.headers.Accept = "application/json";
	else
		node.sandbox.core.options.headers = {Accept: "application/json"};


	while(node.sandbox.core.options.url) {

		console.log(node.sandbox.core.options)
		try {
			node.sandbox.core.options.withCredentials = true
			node.sandbox.core.options.jar = cookieJar
			var result = await axios(node.sandbox.core.options);
			node.sandbox.core.response = result;
			node.sandbox.core.data = result.data;

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



exports.lookupJSON = async function (node) {

	const cookieJar = new tough.CookieJar();
	if(node.sandbox.core.login) {
		node.sandbox.core.login.jar = cookieJar
		node.sandbox.core.login.withCredentials = true
		delete(node.sandbox.core.login.headers)
		node.sandbox.core.login.data = node.sandbox.core.login.body
		delete(node.sandbox.core.login.body)
		debug("Logging in: " + JSON.stringify(node.sandbox.core.login,null,2))
		try {
			await axios(node.sandbox.core.login);
			console.log(cookieJar)
		} catch(e) {
			throw('Login failed ' + e)
		}
	} else {
		debug('No credentials given, no login')
	}

	//var bulk = global.db[node.collection].initializeUnorderedBulkOp();

	var query = {};
	var doc_id = node.settings.doc_id || '';
	if(doc_id) query = {"_id": mongoist.ObjectId(doc_id)}; // single run
	var count = 0

	//node.sandbox.out.say("progress", "started");

    var cursor = global.db[node.collection].findAsCursor(query).addCursorFlag('noCursorTimeout', true);
	while(await cursor.hasNext()) {
		var doc = await cursor.next();
		count++;

		node.sandbox.context.doc = doc;
		node.sandbox.core.data = [];
		node.sandbox.core.response = [];
		node.sandbox.out.value = '';

		// OPTIONS.JS - create options for web request
		node.scripts.options.runInContext(node.sandbox);

		// CALL CORE - if there are several options, then make request for every row
		var t = process.hrtime()
		t = t[0] - node.sandbox.context.startTime[0]
		node.sandbox.out.say('progress','processing ' + count + ' time:' + t + ' seconds')

		if(Array.isArray(node.sandbox.core.options)) {
			var results = []
			for(var options of node.sandbox.core.options) {
				debug("LOOKU REQUEST:", options.method + " -> " + options.url);
				try {
					var result = await axios(options);

					//var result = {status:700}
					//await sleep(200)
					results.push(result);
				} catch(e) {
					console.log(e)
					if(e.response) node.sandbox.core.response = results.push(e.response)
					else node.sandbox.core.response = e
				}
			}
			node.sandbox.core.response = results;
		} else {
			debug("LOOKUP REQUEST:", node.sandbox.core.options.method + " -> " + node.sandbox.core.options.url);
			node.sandbox.core.options.withCredentials = true;
			node.sandbox.core.options.jar = cookieJar;
			try {
				var result = await axios(node.sandbox.core.options)
				node.sandbox.core.response = result
			} catch(e) {
				console.log('error ' + e)
				console.log(e.response.status)
				node.sandbox.core.response = e.response
			}
		}

		// process results
		node.scripts.process.runInContext(node.sandbox);

		// write outcome
		var setter = {}
		setter[node.source.params.out_field] = node.sandbox.out.value;
		debug(setter)
		await global.db[node.collection].update({ '_id': doc._id }, {
			'$set': setter
		});
	}

	if(cursor) cursor.close()
	// make changes to database
	//console.log('executing bulk')
	//await bulk.execute();

	// notify that we are finished
	//node.sandbox.out.say('finish', 'Done');
}


function setAcceptHeaders(node, header) {

	if(node.sandbox.core.options.headers)
		node.sandbox.core.options.headers.Accept = header;
	else
		node.sandbox.core.options.headers = {Accept: header};
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

// for testing
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
