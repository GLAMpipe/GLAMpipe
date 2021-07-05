

var debug 			= require('debug')('GLAMpipe:node');
var csv 			= require('./cores/csv.js');
var web 			= require('./cores/web.js');
var marc 			= require('./cores/marc.js');
var form 			= require('./cores/form.js');

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
			debug(node.sandbox.core.options)
			try {
				await web.getAndSaveFile(node)
				debug("CSV fetched");
				// parse csv
				node.source.params.filename = node.sandbox.core.filename;
				debug("entering csv.read");
				await csv.read(node);
				debug("Done csv.read");
			} catch(e) {
				console.log("web csv failed")
				node.sandbox.out.say('error', 'Import failed ' + e)
			}
		},
		"form": async function(node) {
			// init.js
			debug(node.sandbox.core.options)
			try {
				await form.create(node);
			} catch(e) {
				console.log("form creation failed")
				console.log(e)
			}
		},
	},

// FILE
	"file": {
		"CSV": async function(node) {
			try {
				await csv.read(node)
			} catch(e) {
				console.log(e);
			}
		},
		"MARC": async function(node) {
			try {
				await marc.read(node)
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
