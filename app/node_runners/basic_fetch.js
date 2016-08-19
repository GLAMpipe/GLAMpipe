var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path        = require('path');
var mongoquery 	= require("../../app/mongo-query.js");
var collection = require("../../app/collection.js");
const MP 		= require("../../config/const.js");


var exports = module.exports = {};

exports.fetchData = function (node, sandbox, io, cb) {
	console.log("fetch data with basic fetch");

	// remove previous data inserted by node and start query loop
	var query = {}; 
	query[MP.source] = node._id;
	mongoquery.empty(node.collection, query, function() {
		console.log("URL:", sandbox.out.url)
		requestLoop(node, sandbox, io, cb);
	});

}


/**
 * Fetch item metadata from multiple collections
 */
exports.fetchDataInitialMode = function (node, sandbox, io) {
	var async = require("async");

	// remove previous data inserted by node and start query loop
	var query = {}; 
	query[MP.source] = node._id;
	mongoquery.empty(node.collection, query, function() {
		// init will give us a array of collections
		runNodeScriptInContext("init", node, sandbox, io);
		
		// then we fetch records per collection with async
		async.eachSeries(sandbox.context.vars.collections, function iterator(collection, next) {
			runNodeScriptInContext("pre_run", node, sandbox, io);
			console.log(sandbox.context.vars.collections);
			console.log("INITIAL URL:", sandbox.out.url);
			console.log("ROUND "+ sandbox.context.vars.initial_round_counter +" *************");
			
			requestLoop (node, sandbox, io, function() {
				sandbox.context.vars.initial_round_counter++;
				sandbox.context.vars.round_counter = 0;
				next();
			});
			
		}, function done() {
			runNodeScriptInContext("finish", node, sandbox, io);
		});
	});
}


function fetchDataInitialMode (node, sandbox, io, cb) {
	// remove previous data inserted by node and start query loop
	var query = {}; 
	query[MP.source] = node._id;
	mongoquery.empty(node.collection, query, function() {
		console.log("URL:", sandbox.out.url)
		requestLoop(node, sandbox, io, cb);
	});


}

function requestLoop(node, sandbox, io, cb) {
	var async = require("async");
	async.series([
		function (callback) {

			callAPI(sandbox.out.url, function(error, response, body) {
				if(error) {
					//sandbox.out.say("error", error);
				} else {
					sandbox.context.error = error;
					sandbox.context.response = response;
					sandbox.context.data = body;
					sandbox.out.url = "";
					sandbox.out.schema = [];
					runNodeScriptInContext("run", node, sandbox, io);
					//console.log("SCHEMA:", sandbox.out.schema);
					//console.log("COLLECTIONS:", sandbox.context.vars.collections);
					mongoquery.update("mp_projects", {_id:node.project}, {$addToSet:{"schemas": {"keys": sandbox.out.schema, "types": sandbox.out.key_type, "collection":node.collection}}}, function (error) {
						if(error)
							console.log(error);
						else
							console.log("SCHEMA saved");
					})
					
					
					if(sandbox.context.node_error) 
						return callback(sandbox.context.node_error, null);
					
					
					// add source id to data (expects out.value to be an array)
					if(sandbox.out.value != null) {
						for (var i = 0; i < sandbox.out.value.length; i++ ) {
							// flatten
							//sandbox.out.value[i] = flatten(sandbox.out.value[i], {delimiter:"__"});
							sandbox.out.value[i][MP.source] = node._id;
						}
					
						
						// insert data
						mongoquery.insert(node.collection, sandbox.out.value, function() {
							callback(null, sandbox.out.url);
						});
					}
				}
			});
			
		}

	], function done (err, result){
		if (err) {
			console.log(err);
			return;
		}
			
		// if node provides new url, then continue loop
		if (sandbox.out.url != "") {
			requestLoop(node, sandbox, io, cb)
		} else {
			
			if(cb)
				cb();
			else {
				runNodeScriptInContext("finish", node, sandbox, io);
				return;
			}
		}
	}
)};


function callAPI (url, callback) {
	var request = require("request");

	if (typeof url === "undefined" || url == "")
		return callback("URL not set", null, null);

	console.log("REQUEST:", url);

	var headers = {
		'User-Agent':       'GLAMpipe/0.0.1',
	}

	 var options = {
		url: url,
		method: 'GET',
		headers: headers,
		json: true
	};

	request(options, function (error, response, body) {
		console.log(response.statusCode);
		if (error) {
			//console.log("ERROR:", error);
			callback(error, response, body);
		} else if (response.statusCode == 200) {
			//console.log(body); 
			console.log("SERVER RESPONSE:", response.statusCode);
			callback(null, response, body);
		} else {
			//console.log("SERVER RESPONSE:", response);
			callback("bad response from server:" + response.statusCode, response, body);
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
