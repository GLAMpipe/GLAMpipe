

var requestPromise 	= require('request-promise-native');
var db 				= require('./db.js');
var debug 			= require('debug')('GLAMpipe:node');
var csv 			= require('./cores/csv.js');
var web 			= require('./cores/web.js');

const constants 	= require("../config/const.js");

var exports 		= module.exports = {};

exports.source = {

// WEB
	"web": {
		"JSON": async function(node) {
			try {
				await web.getJSON(node)
			} catch(e) {
				console.log(e);
			}
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

// FILE
	"file": {
		"CSV": async function(node) {
			try {
				await csv.read(node)
			} catch(e) {
				console.log(e);
			}
		}
	},

// COLLECTION
	"collection": {
		"select": async function(node) {
			try {
				await collection.copyToCollection();
			} catch(e) {
				console.log(e)
			}
			console.log(node.settings)
			console.log(node.source.params.source_collection)
			//var r = await db[node.source.params.source_collection].find();
			//console.log(r)
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
