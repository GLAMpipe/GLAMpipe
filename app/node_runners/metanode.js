var request	= require("request");
var path	= require("path");

var exports = module.exports = {};



exports.run = function(doc, sandbox, next) {

	//require('request').debug = true;
	var request = require("request");
	var pass = true;
	
	console.log("metanode.run")
	var count = 0;
	var baseurl = "http://localhost:3000"; // localhost does not require authentication
	console.log(sandbox.context.node.subnodes)
	
	// pre_run may skip whole node sequence
	sandbox.pre_run.runInContext(sandbox);
	if(sandbox.context.skip)
		return next();
	
	// run subnodes
	require("async").eachSeries(sandbox.context.node.subnodes, function iterator (subnode, next_sub) {
		if(pass) {
			//console.log("THIS IS SUBNODE");
			var url = baseurl + "/api/v1/nodes/" + subnode + "/run/" + doc._id.toString();
			//console.log(url);	
			console.log("subnode settings:");
			console.log(sandbox.context.node.pipe[count].settings);
			
			var settings = sandbox.context.node.pipe[count].settings;
			count++;
			
			// POST
			 var options = {
				url: url,
				json: settings,
				headers: {
					"accept": "application/json"
				},
				jar:true
			};
			
			// pass auth token 
			if(sandbox.context.node.req.headers.authorization)
				options.headers.authorization = sandbox.context.node.req.headers.authorization;
			
			//make actual run request
			request.post(options, function (error, response, body) {
				sandbox.context.data = body;
				if (error) {
					console.log(error);
					next_sub();
				} else {
					// if we got error as a response, then we skip rest of the nodes
					if(body.error) {
						pass = false;
						sandbox.context.error = body.error; 
					}
					//console.log(options.url);
					console.log("update response:", body);
					//sandbox.run.runInContext(sandbox);
					next_sub();
				}
			});
			
		} else {
			console.log("SKIPPING:" + subnode)
			next_sub();
		}

	}, function done () {
		sandbox.run.runInContext(sandbox);
		console.log("METANODE: done all nodes!");
		next();
	})
}
