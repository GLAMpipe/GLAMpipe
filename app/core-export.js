var debug 			= require('debug')('GLAMpipe');
var error 			= require('debug')('ERROR');
var axios 			= require('axios');
const axiosCookieJarSupport = require('axios-cookiejar-support').default
const tough			= require('tough-cookie');
const vm 		= require("vm");
var web 			= require('./cores/web.js');
const GP 			= require("../config/const.js");

axiosCookieJarSupport(axios);

var exports 	= module.exports = {};

exports.export = {
	'web': {
		'JSON': async function(node) {
			try {
				await exportLoop(web.sendJSON, node);
			} catch(e) {
				error(e)
				throw(e)
			}
		},
		'request': async function(node) {
			try {
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

	// login once for export
	const cookieJar = new tough.CookieJar();
	if(node.sandbox.core.login) {
		try {
			node.sandbox.core.login.jar = cookieJar
			node.sandbox.core.login.withCredentials = true
			debug("Logging in: " + node.sandbox.core.login.url)
			var login = await axios(node.sandbox.core.login);
			debug(login.status)
		} catch(e) {
			debug(e)
		}

	} else {
		debug('No credentials given, no login')
	}

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

async function doCore(core, node) {
	try {
		await core(node);
		node.scripts.process.runInContext(node.sandbox);
		if(node.sandbox.out.setter) {
			await global.db[node.collection].update({ '_id': node.sandbox.context.doc._id },{
				'$set': node.sandbox.out.setter
			});
		} else if(node.source.params.out_field) {
			var update = {}
			update[node.source.params.out_field] = node.sandbox.out.value
			console.log(update)
			await global.db[node.collection].update({ '_id': node.sandbox.context.doc._id },{
				'$set': update
			});
		}
	} catch(e) {
		throw(e)
	}
}



async function fileLoop(node, core) {
	var fs = require('fs');
	var path = require('path');
	if(!node.source.settings.required_file || node.source.settings.required_file == '') throw("File name missing!")
	// check if process.js code is provided in settings
	if(node.settings.js) {
		var process = new vm.createScript(node.settings.js);
		node.scripts.process = process;
	}
	var filePath = path.join(node.source.project_dir, 'files', node.source.settings.required_file);
	const file = fs.createWriteStream(filePath);
	const cursor = global.db[node.collection].findAsCursor({});
	while(await cursor.hasNext()) {
		node.sandbox.context.doc = await cursor.next();
		try {
			node.scripts.process.runInContext(node.sandbox);
		} catch(e) {
			node.sandbox.out.say("finish", "Error in Script node: 'run' script: " + e.name +" " + e.message);
			console.log(e.stack);
			throw(new Error("Error in Script node: 'run' script: " + e.name +" " + e.message))
		}
		if(typeof node.sandbox.out.value == 'string') file.write(node.sandbox.out.value + "\n");
		else if(typeof node.sandbox.out.value == 'object') {
			try {
				file.write(JSON.stringify(node.sandbox.out.value, null, 2) + "\n")
			} catch (e) {
				throw('conversion failed ' + e)
			}
		}
	}
	file.end();
}



async function CSVfileLoop(node, core) {
	if(node.sandbox.core.options.csvheaders.length === 0) throw(new Error("no fields found!"))
	var fs = require('fs');
	var path = require('path');
	var csvWriter 	= require('csv-write-stream');
	var filePath = path.join(node.source.project_dir, 'files', node.settings.required_file);
	var writer = csvWriter({separator:node.settings.sep, headers: node.sandbox.core.options.csvheaders});
	console.log('csvheaders')
	console.log(node.sandbox.core.options)
	writer.pipe(fs.createWriteStream(filePath));
	const cursor = global.db[node.collection].findAsCursor({});

	while(await cursor.hasNext()) {
		node.sandbox.context.doc = await cursor.next();
		node.scripts.process.runInContext(node.sandbox);
		writer.write(node.sandbox.out.value);
	}
	writer.end();
}
