

var exports = module.exports = {};


exports.postJSON = function (doc, sandbox, next) {
	
	console.log("POST JSON request");
	
	// let node create an upload JSON
	sandbox.pre_run.runInContext(sandbox);
		
	//console.log(JSON.stringify(sandbox.out.setter.upload));

	 var options = {
		url: sandbox.out.url,
		json: sandbox.out.setter.upload,
		headers: {
			"accecpt": "application/json"
		},
		jar:true
	};
	
	var request = require("request");
	//require('request').debug = true;

	// make actual HTTP request
	request.post(options, function (error, response, body) {
		sandbox.context.data = body;
		if (error) {
			console.log(error);
			next();
		} else {
			console.log(options.url);
			console.log("update response:", body);
			sandbox.run.runInContext(sandbox);
			next();
		}
	});
}
