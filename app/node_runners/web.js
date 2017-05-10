var request = require("request");

var exports = module.exports = {};


exports.postJSON = function (doc, sandbox, next) {
	
	console.log("POST JSON request");
	
	// let node create an upload JSON
	sandbox.pre_run.runInContext(sandbox);
	var options = sandbox.out.pre_value; 
	console.log(JSON.stringify(sandbox.out.pre_value, null, 4));

	
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

// get JSON response via GET or POST
exports.fetchJSON = function (options, sandbox, next) {
	
	// make actual HTTP request
	function responseCallback (error, response, body) {
		if (error) {
			console.log(error);
			next();
		} else if (response.statusCode == 200) {
			sandbox.context.data = JSON.parse(body);
			console.log("update response:", body);
			next();
		} else {
			console.log("SERVER RESPONSE: " + response.statusCode)
			next();
		}
	}
	if(sandbox.out.method === "post")
		request.post(options, responseCallback);
	else
		request.get(options, responseCallback); // default method is GET
}

// this is meant to be called from asyncLoop.fieldLoop
exports.uploadFile = function (doc, sandbox, next ) {

	//sandbox.context.doc = doc;
	console.log("upload file");

	if(!sandbox.out.pre_value)
		return next("no upload object from node!");

	var options = doc;
	console.log(JSON.stringify(options, null, 4));

	// skip if file does not exist
	try {
		var stats = fs.statSync(options.file);
	}
	catch(err) {
		console.log("not found")
		return next("file does not exist");
	}

	// create form data and set file reading stream
	var formData = {
		data:JSON.stringify(options.data)
	};
	formData[options.upload_field] = fs.createReadStream(options.file)
	//console.log(JSON.stringify(formData, null, 4));
	
	// make POST request 
	request.post({url:options.url, formData: formData}, function(err, response, body) {
		if (err) {
			console.error('upload failed:', err);
			console.log(body);
			sandbox.context.error = err;
			sandbox.run.runInContext(sandbox);
			next();
		} else {
			console.log('Upload successful!  Server responded with:', body);
			sandbox.context.response = response;
			sandbox.context.data = body;
			sandbox.run.runInContext(sandbox);
			next();
		}
	});

}

