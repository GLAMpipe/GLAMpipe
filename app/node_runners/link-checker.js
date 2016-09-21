var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path        = require('path');
var mongoquery 	= require("../../app/mongo-query.js");
var collection = require("../../app/collection.js");
const MP 		= require("../../config/const.js");


var exports = module.exports = {};

/*
 * 
 * 
 * */
exports.checkLinks = function (doc, sandbox, next) {

	var async = require("async");

	sandbox.context.doc = doc;
	sandbox.context.count++;
	sandbox.out.urls = null;  // reset urls
	sandbox.out.value = [];  // reset output
	
	// ask URL from "pre_run" script
	sandbox.pre_run.runInContext(sandbox);
	
	if(sandbox.out.urls && sandbox.out.urls.constructor.name == "Array") {
		
		sandbox.context.data = [];
		async.eachSeries(sandbox.out.urls, function iterator(url, nextURL) {
			
			headRequest (url, function (err, response) {
				sandbox.context.data.push({"error": err, "response": response});
				nextURL();
			})
			
		}, function done () {
			sandbox.run.runInContext(sandbox);
			next();
		});

	} else {
		console.log("Source field is not an array");
	}
}



function headRequest (url, callback) {
	

	var request = require("request");

	if (typeof url === "undefined" || url == "")
		return callback("URL not set", null);

	console.log("REQUEST:", url);

	var headers = {
		'User-Agent':       'GLAMpipe/0.0.1',
	}

	 var options = {
		url: url,
		method: 'HEAD',
		headers: headers,
		json: true
	};

	request(options, function (error, response, body) {
		callback(error, response);
	});

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
