var mongojs 	= require('mongojs');
var path        = require('path');
var mongoquery 	= require("../../app/mongo-query.js");
var collection = require("../../app/collection.js");
const MP 		= require("../../config/const.js");


var exports = module.exports = {};

/*
 * detect language of certain field
 * 
 * */
exports.language = function (doc, sandbox, next) {

	var async = require("async");
	var cld = require("cld");
	
	var context = sandbox.context; // shortening things a little bit
	var input = context.node.params.in_field;

	sandbox.out.urls = null;  // reset urls
	sandbox.out.value = [];  // reset output

	if (doc[input] && doc[input].constructor.name == "Array") {
		
		sandbox.context.data = [];
		
		async.eachSeries(doc[input], function iterator(value, nextvalue) {
			
			cld.detect(value, function(err, result) {
				sandbox.context.data.push(result);
				nextvalue();
			});
			
		}, function done() {
			sandbox.run.runInContext(sandbox);
			var setter = {};
			setter[context.node.out_field] = sandbox.out.value;
			mongoquery.update(context.node.collection, {_id:sandbox.context.doc._id},{$set:setter}, next);			
		})
		
	} else {
		console.log("ABSTRACT NOT FOUND");
		next();
	}
}




function vara () {
// find everything
mongoquery.find2({}, node.collection, function(err, docs) {
	sandbox.context.doc_count = docs.length;
	console.log(docs.length);
	runNodeScriptInContext("init", node, sandbox, io);
	var cld = require("cld");
	
	// run node once per record
	async.eachSeries(docs, function iterator(doc, next) {

		sandbox.context.doc = doc;
		sandbox.context.count++;
		sandbox.out.value = null;  // reset output
		var input = node.params.in_field;
		
		if (doc[input] && doc[input].constructor.name == "Array") {
			async.eachSeries(doc[input], function iterator(value, nextvalue) {
				sandbox.context.data = [];
				cld.detect(value, function(err, result) {
					sandbox.context.data.push(result);
					console.log("LANG:",result);
					nextvalue();
				});
			}, function done() {
				run.runInContext(sand);
				var setter = {};
				setter[node.out_field] = sandbox.out.value;
				console.log("SETTER:", setter);
				mongoquery.update(node.collection, {_id:sandbox.context.doc._id},{$set:setter}, next);
			})
			
		} else {
			console.log("ABSTRACT NOT FOUND");
			next();
		}

		

		
	}, function done () {
		runNodeScriptInContext("finish", node, sandbox, io);
		//exports.updateView(node, sandbox, io, function(msg) {console.log("NODE: view created", msg);});
	});
});
}
