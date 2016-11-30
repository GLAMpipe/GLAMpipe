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
