//var web 		= require('./cores/web.js');
var requestPromise = require('request-promise-native');
var db 			= require('./db.js');
const GP 		= require("../config/const.js");

var exports 	= module.exports = {};

exports.export = {
	'web': {
		'JSON': async function(node) {
			await webLoop(node);
		}
	},
	'file': {
		'csv': async function(node) {
			await fileLoop(node);
		}
	}
}

async function fileLoop(node, core) {
	var fs = require('fs');
	var path = require('path');
	var csvWriter 	= require('csv-write-stream');
	var filePath = path.join(node.source.project_dir, node.source.params.required_file);
	var writer = csvWriter({separator:node.settings.sep, headers: node.sandbox.core.options.csvheaders});
	writer.pipe(fs.createWriteStream(filePath));
	const cursor = db[node.collection].findAsCursor({});	
	while(await cursor.hasNext()) {
		var doc = await cursor.next();
	  
		node.sandbox.context.doc = doc;
		node.scripts.run.runInContext(node.sandbox);
		writer.write(node.sandbox.out.value);
	}	
	writer.end();
}

async function webLoop(node, core) {

	//var bulk = db[node.collection].initializeOrderedBulkOp();
	const cursor = db[node.collection].findAsCursor({});	
	while(await cursor.hasNext()) {
		var doc = await cursor.next();
	  
		node.sandbox.context.doc = doc;
		// PRE_RUN - give input to core (core.options)
		node.scripts.pre_run.runInContext(node.sandbox);
		
		node.sandbox.core.options.resolveWithFullResponse = true;

		// make sure that content type header is set
		if(node.sandbox.core.options.headers) 
			node.sandbox.core.options.headers['Content-Type'] = 'application/json';
		else
			node.sandbox.core.options.headers = {'Content-Type': 'application/json'};

		console.log("REQUEST: ", node.sandbox.core.options.url);

		// CALL CORE - if there are several files, then call core once for every row
		if(Array.isArray(node.sandbox.core.options)) {
			node.sandbox.core.data = [];
			for(var options of node.sandbox.core.options) {
				//console.log(options)
				//var core_result = await requestPromise(options);
				//node.sandbox.core.data.push(core_result)
			}
		} else {
			var result = null;
			try {
				result = await requestPromise(node.sandbox.core.options);
				node.sandbox.core.data = result;
			} catch(e) {
				console.log("ERROR: " + e.message)
				node.sandbox.core.error = e;
			}
		}

		// let GP node script to process data
		node.scripts.run.runInContext(node.sandbox);
		
		await db[node.collection].update({ '_id': doc._id },{
			'$set': node.sandbox.out.setter
		});
	}	
	
	// make changes to database
	//await bulk.execute();

	// notify that we are finished
	//node.sandbox.out.say('finish', 'Done');
}
