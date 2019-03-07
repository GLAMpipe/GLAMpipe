

var requestPromise = require('request-promise-native');
var db = require('./db.js');

var exports 	= module.exports = {};

exports.web = {

	"get": {
		"JSON": async function(node) {
			console.log("web.get.JSON");
			console.log("REQUEST:", node.sandbox.core.options.method + " -> " + node.sandbox.core.options.url);
			
			if(node.sandbox.core.options.headers) 
				node.sandbox.core.options.headers.Accept = "application/json";
			else
				node.sandbox.core.options.headers = {Accept: "application/json"};
											
			// we want statuscode	
			node.sandbox.core.options.resolveWithFullResponse = true;
				
			while(node.sandbox.core.options.url) {

				var result = await requestPromise(node.sandbox.core.options);
				node.sandbox.core.response = result;
				node.sandbox.core.data = JSON.parse(result.body);

				node.sandbox.core.options.url = null; // reset url
				
				// handle data and get new options
				try {
					node.scripts.run.runInContext(node.sandbox);
				} catch(e) {
					console.log(e)
				}

				// write data
				if(node.sandbox.out.value) {
					await db[node.collection].insert(node.sandbox.out.value);
				}
			}
		}
	}
}


exports.file = {

	"CSV": {
		"read": function() {
			console.log("read CSV");
		}
	}

}
