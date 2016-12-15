var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path        = require('path');
var mongoquery 	= require("../app/mongo-query.js");
var collection = require("../app/collection.js");
const MP 		= require("../config/const.js");


var exports = module.exports = {};

exports.loop = function (node, sandbox, onDoc) {

	loop (node, sandbox, onDoc);
	
	mongoquery.update("mp_projects", {_id:node.project}, {$addToSet:{"schemas": {"keys": sandbox.out.schema, "types": sandbox.out.key_type, "collection":node.collection}}}, function (error) {
		if(error)
			console.log(error);
		else
			console.log("SCHEMA saved");
	})

}


function loop (node, sandbox, onDoc) {

	// find everything
	mongoquery.find2({}, node.collection, function (err, docs) {
		
		sandbox.context.doc_count = docs.length;
		console.log(node.settings);
		
		// run node once per record
		require("async").eachSeries(docs, function iterator (doc, next) {

			sandbox.context.doc = doc;
			sandbox.context.count++;
			
			// call document processing function
			onDoc(doc, sandbox, function processed () {
				if(sandbox.out.setter != null) {
					var setter = sandbox.out.setter; 
				} else {
					var setter = {};
					setter[node.out_field] = sandbox.out.value;
				}
				//console.log("setter:", setter);
				
				mongoquery.update(node.collection, {_id:sandbox.context.doc._id},{$set:setter}, next);
			});

		}, function done () {
			sandbox.finish.runInContext(sandbox);
		});
	});

}


