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
	}
}



async function webLoop(node, core) {

	// we try to login first
	const j = requestPromise.jar();
	node.scripts.login.runInContext(node.sandbox);
	node.sandbox.core.login.jar = j;
	node.sandbox.core.login.resolveWithFullResponse = true
	try {
		var login_result = await requestPromise(node.sandbox.core.login);
		console.log(login_result.statusCode);
	} catch(e) {
		//throw(e)
	}

	var bulk = db[node.collection].initializeOrderedBulkOp();
	const cursor = db[node.collection].findAsCursor({});	
	while(await cursor.hasNext()) {
		var doc = await cursor.next();
	  
		node.sandbox.context.doc = doc;
		// PRE_RUN - give input to core (core.files)
		node.scripts.pre_run.runInContext(node.sandbox);
		node.sandbox.core.options.jar = j;

		// make sure that content type header is set
		if(node.sandbox.core.options.headers) 
			node.sandbox.core.options.headers['Content-Type'] = 'application/json';
		else
			node.sandbox.core.options.headers = {'Content-Type': 'application/json'};

		// CALL CORE - if there are several files, then call core once for every row
		if(Array.isArray(node.sandbox.core.options)) {
			for(var options of node.sandbox.core.options) {
				//console.log(options)
				var result = await requestPromise(options);
			}
		} else {
			node.sandbox.core.options.resolveWithFullResponse = true
			var core_result = await requestPromise(node.sandbox.core.options);
			node.sandbox.core.data = core_result;
		}

		// let GP node script to process data
		node.scripts.run.runInContext(node.sandbox);
		
		bulk.find({ '_id': doc._id }).updateOne({
			'$set': node.sandbox.out.setter
		});
	}	
	
	// make changes to database
	await bulk.execute();

	// notify that we are finished
	//node.sandbox.out.say('finish', 'Done');
}
