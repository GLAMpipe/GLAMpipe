var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path		= require('path');
var async 		= require('async');

var mongoquery 	= require("../../app/mongo-query.js");
var collection 	= require("../../app/collection.js");


var exports = module.exports = {};



/**
 * Handle DSpace login
 */
exports.login = function (node, sandbox, io, cb) {

	var request = require("request");

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
	request.post(options, function(error, response, body) {
		
		var options = {
			headers: {'content-type' : 'application/json'},
			url: sandbox.out.config.status_url,
			method: 'GET',
			json: true,
			jar:true
		};
		// confirm login
		console.log("CONFIRMING LOGIN...");
		request.get(options, function(error, response, body) {
			if(body.authenticated)
				cb(null);
			else 
				cb("Authentication failed");
		});
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

