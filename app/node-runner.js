var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path        = require('path');
var mongoquery 	= require("../app/mongo-query.js");
var collection = require("../app/collection.js");


var exports = module.exports = {};

exports.updateData = function (node, sandbox, io) {

	// ask login detail (username, pass etc.) from node
	runNodeScriptInContext("login", node, sandbox, io);
	console.log(sandbox.out.config);
	callAPI (sandbox, node, function() {
		console.log(sandbox);
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



/**
 * Make HTTP request in the record context
 */ 
function callAPI (sandbox, node, cb) {

	var request = require("request");

	 var options = {
		url: sandbox.out.url,
		method: 'POST',
		json: true
	};

	// make actual HTTP request
	request(options, function (error, response, body) {
			sandbox.context.error = error;
			sandbox.context.response = response;
			sandbox.context.data = body;
			cb(sandbox)
	});
}
