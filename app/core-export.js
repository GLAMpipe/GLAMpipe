var debug 			= require('debug')('GLAMpipe');
var error 			= require('debug')('ERROR');
var requestPromise 	= require('request-promise-native');
var web 			= require('./cores/web.js');
const GP 			= require("../config/const.js");

var exports 	= module.exports = {};

exports.export = {
	'web': {
		'JSON': async function(node) {
			try {
				//await jarLogin(node);
				await exportLoop(web.sendJSON, node);
			} catch(e) {
				error(e)
				throw(e)
			}
		}
	},
	'file': {
		'csv': async function(node) {
			await CSVfileLoop(node);
		},
		'JSON': async function(node) {
			await fileLoop(node);
		}
	}
}



async function exportLoop(core, node) {
	
	// if there is a doc already, then this is single run
	if(node.sandbox.context.doc) {
		await doCore(core, node)
		

	// otherwise loop through all documents
	} else {
		const cursor = global.db[node.collection].findAsCursor({});	
		while(await cursor.hasNext()) {
			node.sandbox.context.doc = await cursor.next();
			await doCore(core, node);
		}
	}
}


async function fileLoop(node, core) {
	var fs = require('fs');
	var path = require('path');
	if(!node.source.settings.required_file || node.source.settings.required_file == '') throw("File name missing!")
	var filePath = path.join(node.source.project_dir, 'files', node.source.settings.required_file);
	const file = fs.createWriteStream(filePath);
	const cursor = global.db[node.collection].findAsCursor({});	
	while(await cursor.hasNext()) {
		node.sandbox.context.doc = await cursor.next();
		node.scripts.process.runInContext(node.sandbox);
		file.write(node.sandbox.out.value);
	}	
	file.end();
}



async function CSVfileLoop(node, core) {
	var fs = require('fs');
	var path = require('path');
	var csvWriter 	= require('csv-write-stream');
	var filePath = path.join(node.source.project_dir, 'files', node.source.params.required_file);
	var writer = csvWriter({separator:node.settings.sep, headers: node.sandbox.core.options.csvheaders});
	writer.pipe(fs.createWriteStream(filePath));
	const cursor = global.db[node.collection].findAsCursor({});	
	while(await cursor.hasNext()) {
		node.sandbox.context.doc = await cursor.next();
		node.scripts.process.runInContext(node.sandbox);
		writer.write(node.sandbox.out.value);
	}	
	writer.end();
}



async function doCore(core, node) {
	try {
		await core(node);
		node.scripts.process.runInContext(node.sandbox);
		await global.db[node.collection].update({ '_id': node.sandbox.context.doc._id },{
			'$set': node.sandbox.out.setter
		});		

	} catch(e) {
		throw(e)
	}
}



async function jarLogin(node) {
	
	if(node.scripts.login) {
		node.scripts.login.runInContext(node.sandbox);
		debug("Logging in: " + node.sandbox.core.login.url)
		node.sandbox.core.login.resolveWithFullResponse = true;
		try {
			node.sandbox.core.login.jar = requestPromise.jar();
			var result = await requestPromise(node.sandbox.core.login);
		} catch(e) {
			debug("ERROR: " + e.message)
			throw("Login error")
		}
	} else {
		return true;
	}
}








