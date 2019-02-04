

var rp = require('request-promise-native');
var db = require('./db.js');

var exports 	= module.exports = {};

exports.web = {

	"get": {
		"JSON": async function(node) {
			console.log("web.get.JSON");
			var options = node.sandbox.core.options;		
			console.log("REQUEST:", options.method + " -> " + options.url);
			
			if(options.headers) 
				options.headers.Accept = "application/json";
			else
				options.headers = {Accept: "application/json"};
				
			// we want statuscode	
			options.resolveWithFullResponse = true;
				
			while(options.url) {
				var result = await rp(options);
				node.sandbox.core.response = result;
				node.sandbox.core.data = JSON.parse(result.body);

				// handle data and get new options
				try {
					node.scripts.run.runInContext(node.sandbox);
				} catch(e) {
					console.log(e)
				}

				if(node.sandbox.out.value) {
					console.log("tallennan..." + node.collection)
					await db[node.collection].insert(node.sandbox.out.value);
				}
				console.log(node.sandbox.core.options.url)
				console.log(options.url)

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
