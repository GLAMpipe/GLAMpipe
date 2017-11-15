var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path		= require('path');
var mongoquery	= require("../../app/mongo-query.js");
var collection	= require("../../app/collection.js");
var nodescript	= require("../../app/run-node-script.js");
var schema		= require("../../app/schema.js");
const MP 		= require("../../config/const.js");


// TODO: merge this to web.js

var exports = module.exports = {};

exports.fetchData = function (node, sandbox, io, cb) {
	console.log("fetch data with basic fetch");
	sandbox.out.say("progress", "Fetch started...");

	// remove previous data inserted by node and start query loop
	var query = {}; 
	query[MP.source] = node._id;
	
	// In update mode we compare some field of the existing records to same field of imported records.
	// implementation is not optimal but works...
	if(node.settings.mode === "update") {
		if(node.settings.update_key) {
			console.log("WEB: update mode")
			mongoquery.findDistinct({}, node.collection, node.settings.update_key, function(err, records) {
				sandbox.context.records = records;
				nodescript.runNodeScriptInContext("init", node, sandbox, io);
				console.log("URL:", sandbox.out.url)
				requestLoop(node, sandbox, io, cb);
			})
		} else {
			sandbox.out.say("error", "You must set update field in update mode");
			return;
		}
	} else {
		mongoquery.empty(node.collection, query, function() {
			// init will give us an initial url
			nodescript.runNodeScriptInContext("init", node, sandbox, io);
			console.log("URL:", sandbox.out.url)
			requestLoop(node, sandbox, io, cb);
		});
	}
}



// this keeps asking data until there is no url
function requestLoop(node, sandbox, io, cb) {
	var async = require("async");
	async.series([
		function (callback) {

			callAPI(sandbox.out.url, function(error, response, body) {
				if(error) {
					console.log(error);
					//nodescript.runNodeScriptInContext("finish", node, sandbox, io);
					sandbox.finish.runInContext(sandbox);
					sandbox.out.say("error", error);
					return;
				} else {
					sandbox.context.error = error;
					sandbox.context.response = response;
					sandbox.context.data = body;
					sandbox.out.url = "";
					sandbox.out.schema = [];
					nodescript.runNodeScriptInContext("run", node, sandbox, io);
					
					if(sandbox.context.node_error) 
						return callback(sandbox.context.node_error, null);
					
					
					// add source id to data (expects out.value to be an array)
					if(sandbox.out.value != null) {
						for (var i = 0; i < sandbox.out.value.length; i++ ) {
							sandbox.out.value[i][MP.source] = node._id;
						}
					
						
						// insert data
						mongoquery.insert(node.collection, sandbox.out.value, function() {
							callback(null, sandbox.out.url);
						});
						
					// we found nothing, proceed anyway	
					} else {
						callback(null, sandbox.out.url);
					}
				}
			});
			
		}

	], function done(err, result) {
		if(err) {
			console.log(err);
			return;
		}

		// check if user asked for termination of the node run
		if(!node.req.query.force && !global.register[node.req.originalUrl]) {
			console.log("REGISTER: user terminated node run...");
			sandbox.finish.runInContext(sandbox);
			return;
		}

		// if node provides new url, then continue loop
		if (sandbox.out.url != "") {
			console.log("calling requestLoop from requestLoop");
			requestLoop(node, sandbox, io, cb)
		} else {
			schema.createCollectionSchema(node);
			if(cb)
				cb();
			else {
				nodescript.runNodeScriptInContext("finish", node, sandbox, io);
				return;
			}
		}
	}
)};

function callAPI (url, callback) {
	var request = require("requestretry");

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
		json: true,
		jar: true,
		maxAttempts: 5,
		retryDelay: 1000
	};

	request(options, function (error, response, body) {
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



