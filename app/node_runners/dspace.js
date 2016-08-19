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
	console.log(sandbox.out.config);

	 var options = {
		headers: {'content-type' : 'application/x-www-form-urlencoded'},
		url: sandbox.out.url,
		method: 'POST',
		form: sandbox.out.config.login,
		json: true,
		jar:true
	};
	
	// send login information
	callAPIlogin (options, sandbox, function(sandbox) {
		
		var options = {
			headers: {'content-type' : 'application/json'},
			url: "http://siljo.lib.jyu.fi:8080/rest/status",
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




exports.updateData = function (node, sandbox, io) {
	var async 		= require("async");
	console.log("Ready to update!");

	// find everything
	mongoquery.find2({}, node.collection, function(err, docs) {
		sandbox.context.doc_count = docs.length;
		console.log(docs.length);
		runNodeScriptInContext("init", node, sandbox, io);
		
		// run node once per record
		async.eachSeries(docs, function iterator(doc, next) {

			sandbox.context.doc = doc;
			sandbox.context.count++;
			sandbox.out.value = null;  // reset output


			var abs =  doc.dc_title + " (Editoitu RESTin kautta) ";
			var metadata = [{"key":"dc.title", "value":abs, "language": "fi"},{"key":"dc.title", "value":abs, "language": "en"}];
			
			//next();

			 var options = {
				url: "http://siljo.lib.jyu.fi:8080/rest/items/" + doc.uuid + "/metadata",
				json: metadata,
				jar:true
			};
			
			var request = require("request");
			//require('request').debug = true;

			// make actual HTTP request
			request.put(options, function (error, response, body) {
				if (error) 
					console.log(error);
				else {
					console.log(options.url);
					console.log("update response:", body);
					next();
				}
				//cb(sandbox)
			});

			

			
		}, function done () {
			runNodeScriptInContext("finish", node, sandbox, io);
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
