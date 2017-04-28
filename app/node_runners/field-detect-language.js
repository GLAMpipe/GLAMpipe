var mongojs 	= require('mongojs');
var path        = require('path');
var mongoquery 	= require("../../app/mongo-query.js");
var collection  = require("../../app/collection.js");
const MP 		= require("../../config/const.js");
var async 		= require("async");
var cld 		= require("cld");

var exports = module.exports = {};

/*
 * detect language of certain field
 * 
 * */
exports.language = function (doc, sandbox, next) {

	
	var context = sandbox.context; // shortening things a little bit
	var input_field = context.node.params.in_field;
	var input = doc[input_field];

	sandbox.out.value = [];  // reset output
	sandbox.context.data = [];
	

	
	// force to array
	if(input && !Array.isArray(input))
		input = [input];
	
	async.eachSeries(input, function iterator(value, nextvalue) {
		
		cld.detect(limitText(value), function(err, result) {
			console.log("detection result", result);
			sandbox.context.data.push(result);
			nextvalue();
		});
		
	}, function done() {
		sandbox.run.runInContext(sandbox);
		var setter = {};
		setter[context.node.out_field] = sandbox.out.value;
		mongoquery.update(context.node.collection, {_id:sandbox.context.doc._id},{$set:setter}, next);			
	})
		
}

function limitText(str) {
	//we take 4000 characters form the middle of the text
	if(str.length > 4000)
		return str.slice(str.length/2-2000, str.length/2+2000);
	else 
		return str;
}
