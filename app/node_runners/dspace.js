var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path        = require('path');
var async = require('async');

var mongoquery 	= require("../../app/mongo-query.js");
var collection = require("../../app/collection.js");


var exports = module.exports = {};



/**
 * Handle DSpace login
 */
exports.login = function (node, sandbox, io, cb) {

	// ask login details (email, password) from node
	runNodeScriptInContext("login", node, sandbox, io);
	console.log("DSpace login url:" , sandbox.out.config.url);

	 var options = {
		headers: {'content-type' : 'application/x-www-form-urlencoded'},
		url: sandbox.out.config.url,
		method: 'POST',
		form: sandbox.out.config.login,
		json: true,
		jar:true
	};
	
	// send login information
	callAPIlogin (options, sandbox, function(sandbox) {
		
		var options = {
			headers: {'content-type' : 'application/json'},
			url: sandbox.out.config.status_url,
			method: 'GET',
			json: true,
			jar:true
		};
		// confirm login
		callAPIlogin (options, sandbox, function(sandbox) {
			console.log(sandbox.context.data );
			if(sandbox.context.data.authenticated)
				cb();
			else 
				cb("Authentication failed");
		});
	});

}


exports.uploadItem = function (doc, sandbox, next) {
	
	console.log("upload item");
	
	// let node create an upload item
	sandbox.pre_run.runInContext(sandbox);
		
	console.log(JSON.stringify(sandbox.out.setter.upload));

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



exports.updateData = function (doc, sandbox, next) {

	// let node create an update item
	sandbox.pre_run.runInContext(sandbox);
	
	if(sandbox.out.error) {
		console.log(sandbox.out.error);
		sandbox.out.say("error", sandbox.out.error);
		return;
	}
	console.log("URL:" + sandbox.out.url);
	if(sandbox.out.value == null || sandbox.out.url === null) {
		next();
		console.log("HITTING NEXT BECAUSE OF NULL*******************");
	} else {
		console.log("out.value");
		console.log(sandbox.out.value);
		console.log(sandbox.out.value === null);

		 var options = {
			url: sandbox.out.url,
			json: sandbox.out.value,
			jar:true
		};
		
		console.log("options:" + options);
		console.log(options);
		
		var request = require("request");
		//require('request').debug = true;

		// make actual HTTP request
		request.put(options, function (error, response) {
			sandbox.context.response = response;
			if (error) 
				console.log(error);
			else {
				console.log("URL:", options.url);
				console.log("update response:", response.statusMessage);
				sandbox.run.runInContext(sandbox);
				next();
			}
		});
	}


}


exports.addMetadataField = function (doc, sandbox, next) {

	// let node create an update item
	sandbox.pre_run.runInContext(sandbox);
	
	 var options = {
		url: sandbox.out.url,
		json: sandbox.out.value,
		jar:true
	};
	
	var request = require("request");
	//require('request').debug = true;

	// make actual HTTP request
	request.post(options, function (error, response) {
		sandbox.context.response = response;
		if (error) 
			console.log(error);
		else {
			console.log("DATA:", sandbox.out.value);
			console.log("URL:", options.url);
			console.log("update response:", response.statusMessage);
			sandbox.run.runInContext(sandbox);
			next();
		}
	});
}

exports.addFile = function (doc, sandbox, nextDoc) {

	// let node create an array of upload items (url, file title, file path)
	sandbox.pre_run.runInContext(sandbox);

	//var filepath = "/home/arihayri/Documents/GLAMpipe-testausdata/kuvat/gp_logo.png";
	//var url = "https://demo.dspace.org/rest/items/0b74940e-782e-4aeb-b02b-67b96d39311d/bitstreams?name=ryijy.png";
	var fs = require('fs');
	var request = require("request");

	var options = {
		jar:true,
		headers: {
			"accept": "application/json"
		}
	}

	// loop through array asynchronously
	async.eachSeries(sandbox.out.value, function (upload, nextEle) {
		options.url = upload.url + "?name=" + upload.title; // file name provided here!!
		console.log(upload);


		var req = 	request.post(options, function optionalCallback(err, response, body) {
		  if (err) {
			return console.error('upload failed:', err);
		  }
		  console.log('Upload successful!  Server responded with:', response.statusCode);
		  console.log('Upload successful!  Server responded with:', body);
		  nextEle();
		});
		
		var stats = fs.statSync(upload.filepath)
		console.log("filun koko:" + stats.size);
		var size = 0;

		file_stream = fs.createReadStream(upload.filepath);
		file_stream.on('data', function(chunk) {
			console.log("reading..." + chunk.length);
			size += chunk.length;
		});
		file_stream.on('end', function() {
			console.log("file is read");	
			console.log(size);	
			console.log((size/1000).toFixed(2));	
		});
		
		//request.get("https://upload.wikimedia.org/wikipedia/commons/3/3c/Keuruun_ryijy.jpg").pipe(req);
		file_stream.pipe(req);

		
	}, function done() {
		//sandbox.run.runInContext(sandbox);
		nextDoc();
	})




}




function runNodeScriptInContext (script, node, sandbox, io) {
	try {
		vm.runInNewContext(node.scripts[script], sandbox);
	} catch (e) {
		if (e instanceof SyntaxError) {
			console.log("Syntax error in node.scripts."+script+"!", e);
			io.sockets.emit("error", "Syntax error in node.scripts."+script+"!</br>" + e);
			throw new NodeScriptError("syntax error:" + e.message);
		} else {
			console.log("Error in node.scripts."+script+"!",e);
			io.sockets.emit("error", "Error in node.scripts."+script+"!</br>" + e);
			throw new NodeScriptError(e.message);
		}
	}
}

function NodeScriptError (message) {
	this.message = message;
	this.name = "NodeScriptError";
}

/**
 * Make HTTP request in the record context
 */ 
function callAPIlogin (options, sandbox, cb) {

	var request = require("request");

	// make actual HTTP request
	request(options, function (error, response, body) {
		if (error) 
			console.log(error);
		console.log(body);
		console.log(options);
		sandbox.context.error = error;
		sandbox.context.response = response;
		sandbox.context.data = body;
		cb(sandbox)
	});
}
