var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path        = require('path');
var mongoquery 	= require("../../app/mongo-query.js");
var collection = require("../../app/collection.js");


var exports = module.exports = {};



/**
 * Handle DSpace login
 */
exports.login = function (node, sandbox, io, cb) {

	// ask login details (email, password) from node
	runNodeScriptInContext("login", node, sandbox, io);
	console.log("DSpace login url:" ,sandbox.out.login_url);

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
	sandbox.run.runInContext(sandbox);
	console.log(JSON.stringify(sandbox.out.setter.upload));

	 var options = {
		url: sandbox.out.url,
		json: sandbox.out.setter.upload,
		jar:true
	};
	
	var request = require("request");
	//require('request').debug = true;

	// make actual HTTP request
	request.post(options, function (error, response, body) {
		if (error) 
			console.log(error);
		else {
			console.log(options.url);
			console.log("update response:", body);
			next();
		}
	});



}



exports.updateData = function (doc, sandbox, next) {

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
	request.put(options, function (error, response) {
		if (error) 
			console.log(error);
		else {
			console.log("URL:", options.url);
			console.log("update response:", response.statusMessage);
			next();
		}
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
