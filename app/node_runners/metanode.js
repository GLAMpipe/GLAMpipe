var request	= require("request");
var path	= require("path");

var exports = module.exports = {};



exports.run = function(doc, sandbox, next) {

	console.log("metanode.run")
	var count = 0;
	var baseurl = "http://localhost:3000"; // localhost does not require authentication
	console.log(sandbox.context.node.subnodes)
	
	// run subnodes
	require("async").eachSeries(sandbox.context.node.subnodes, function iterator (subnode, next_sub) {
		console.log("THIS IS SUBNODE");
		var url = baseurl + "/api/v1/nodes/" + subnode + "/run/" + doc._id.toString();
		console.log(url);	
		console.log("subnode settings:");
		console.log(sandbox.context.node.pipe[count].settings);
		
		var settings = sandbox.context.node.pipe[count].settings;
		count++;
		
		// POST
		 var options = {
			url: url,
			json: settings,
			headers: {
				"accecpt": "application/json"
			},
			jar:true
		};
		
		var request = require("request");
		//require('request').debug = true;

		//make actual HTTP request
		request.post(options, function (error, response, body) {
			sandbox.context.data = body;
			if (error) {
				console.log(error);
				next_sub();
			} else {
				console.log(options.url);
				console.log("update response:", body);
				//sandbox.run.runInContext(sandbox);
				next_sub();
			}
		});
		
		//next();

					
	}, function done () {
		console.log("METANODE: done all nodes!");
		next();
	})
}
