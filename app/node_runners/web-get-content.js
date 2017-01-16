var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path        = require('path');
var request 	= require("request");

var mongoquery 	= require("../../app/mongo-query.js");
var collection  = require("../../app/collection.js");
const MP 		= require("../../config/const.js");


var exports = module.exports = {};


exports.request = function (doc, sandbox, next) {

	sandbox.context.doc = doc;
	sandbox.context.count++;
	sandbox.out.value = null;  // reset output
	
	// ask node file location
	sandbox.pre_run.runInContext(sandbox);
	console.log(sandbox.out.url);

	 var options = {
		url: sandbox.out.url,
		method: 'GET',
		json: true
	};

	// make actual HTTP request
	request(options, function (error, response, body) {
		sandbox.context.error = error;
		sandbox.context.response = response;
		sandbox.context.data = body;
		sandbox.run.runInContext(sandbox); // pass result to node
		next();
	});
}


exports.uploadFile = function (doc, sandbox, next ) {

	sandbox.context.doc = doc;
	sandbox.out.value = null;  // reset output
	sandbox.pre_run.runInContext(sandbox);


	if(!sandbox.out.value)
		return next("no upload object from node!");

	var upload = sandbox.out.value;
	//console.log(upload);
	console.log("UPLOADING:");
	console.log("file: " + upload.filepath);
	console.log("url: " + upload.url);

	// skip if file does not exist
	try {
		var stats = fs.statSync(upload.filepath);
	}
	catch(err) {
		return next("file does not exist");
	}

	var formData = {
		input: fs.createReadStream(upload.filepath)
	};


	var options = {
		uri: upload.url,
		jar:true,
		headers: { // TODO: these should be set by node
			"accept": "application/xml",
			"content-type": "application/pdf"
		},
		formData: formData
	}

	console.log("GROBIDing......");
	request.post(options, function optionalCallback(err, response, body) {
		if (err) {
			//console.error('upload failed:', err);
			sandbox.context.error = err;
			sandbox.run.runInContext(sandbox);
			next();
		  } else {
			  console.log('Upload successful!  Server responded with:', response.statusCode);
			  sandbox.context.response = response;
			  sandbox.context.data = body;
			  sandbox.run.runInContext(sandbox);
			  next();
		}
	});
}
