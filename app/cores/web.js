
var requestPromise = require('request-promise-native');
var debug 			= require('debug')('GLAMpipe:node');

exports.postJSON= async function (options) {
	
	//node.sandbox.core.options.resolveWithFullResponse = true;
	var result = await requestPromise(options);
	return result;

}

exports.getJSON= async function (options) {
	
	debug("REQUEST:", node.sandbox.core.options.method + " -> " + node.sandbox.core.options.url);
	
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

}
