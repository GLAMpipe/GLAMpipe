

var requestPromise 	= require('request-promise-native');
var db 				= require('./db.js');
var debug 			= require('debug')('GLAMpipe:node');
var csv 			= require('./cores/csv.js');

const constants 	= require("../config/const.js");

var exports 		= module.exports = {};

exports.source = {

	"web": {
		"JSON": async function(node) {
			console.log("REQUEST:", node.sandbox.core.options.method + " -> " + node.sandbox.core.options.url);
			
			if(node.sandbox.core.options.headers) 
				node.sandbox.core.options.headers.Accept = "application/json";
			else
				node.sandbox.core.options.headers = {Accept: "application/json"};
											
			// we want statuscode	
			node.sandbox.core.options.resolveWithFullResponse = true;
				
			while(node.sandbox.core.options.url) {

				console.log(node.sandbox.core.options.url)
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
		},


		"CSV": async function(node) {
			// init.js 
			console.log(node.sandbox.core.options)
			console.log(node.sandbox.core.filename)
			// download file
			var result = await requestPromise(node.sandbox.core.options);
			// save to node directory
			const fs = require("fs");
			fs.writeFileSync(node.sandbox.core.filename, result, 'utf-8')
			// parse csv
			node.source.params.filename = node.sandbox.core.filename;
			debug("entering csv.read");
			csv.read(node);
			debug("Done csv.read");
		}
	},


	"file": {
		"CSV": async function(node) {
			try {
				await csv.read(node)
			} catch(e) {
				console.log(e);
			}
		}
	}
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
