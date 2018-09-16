

var rp = require('request-promise-native');
var db = require('./db.js');

var exports 	= module.exports = {};

exports.web = {

	"get": {
		"JSON": async function(node) {
			console.log("web.get.JSON");
			var options = node.sandbox.out.options;		
			console.log("REQUEST:", options.method + " -> " + options.url);
			
			if(options.headers) 
				options.headers.Accept = "application/json";
			else
				options.headers = {Accept: "application/json"};
				
			// we want statuscode	
			options.resolveWithFullResponse = true;
				
			while(options.url) {
				var result = await rp(options);
				node.sandbox.context.response = result;
				node.sandbox.context.data = JSON.parse(result.body);
				
				options.url = "";
				node.scripts.run.runInContext(node.sandbox);
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
