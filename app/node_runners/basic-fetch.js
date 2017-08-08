var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path        = require('path');
var mongoquery 	= require("../../app/mongo-query.js");
var collection = require("../../app/collection.js");
var nodescript = require("../../app/run-node-script.js");
var schema 		= require("../../app/schema.js");
const MP 		= require("../../config/const.js");


// TODO: merge this to web.js

var exports = module.exports = {};

exports.fetchData = function (node, sandbox, io, cb) {
	console.log("fetch data with basic fetch");

	// remove previous data inserted by node and start query loop
	var query = {}; 
	query[MP.source] = node._id;
	mongoquery.empty(node.collection, query, function() {
		// init will give us an initial url
		nodescript.runNodeScriptInContext("init", node, sandbox, io);
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

	], function done (err, result){
		if (err) {
			console.log(err);
			return;
		}
			
		// if node provides new url, then continue loop
		if (sandbox.out.url != "") {
			console.log("calling requestLoop from requestLoop");
			requestLoop(node, sandbox, io, cb)
		} else {
			
			if(cb)
				cb();
			else {
				nodescript.runNodeScriptInContext("finish", node, sandbox, io);
				return;
			}
		}
	}
)};




