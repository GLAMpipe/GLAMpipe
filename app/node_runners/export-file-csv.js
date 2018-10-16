
var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path        = require('path');
var async 		= require("async");
var csvWriter 	= require('csv-write-stream')
var mongoquery 	= require("../../app/mongo-query.js");
var collection  = require("../../app/collection.js");
var nodescript  = require("../../app/run-node-script.js");
const MP 		= require("../../config/const.js");


var exports = module.exports = {};

exports.collectionToFile = function (node, sandbox, io) {

	// make sure that we have an export filename
	if(node.params.required_file == "") {
		console.log("ERROR: filename missing!");
		io.sockets.emit("error", {"nodeid":node._id, "msg":"ERROR: filename missing! Re-create node and give file name."});
		return;
	}

	if(sandbox.out.csvheaders.length == 0) {
		sandbox.out.say("error", "You must choose some fields!");
		return;
	}

	// we stream directly to file
	var fs = require('fs');
	var filePath = path.join(node.dir, sandbox.out.filename);
	var writer = csvWriter({separator:node.settings.sep, headers: sandbox.out.csvheaders});
	writer.pipe(fs.createWriteStream(filePath));

	// find everything
	mongoquery.find2({}, node.collection, function (err, docs) {
		
		// tell node how many records was found
		sandbox.context.doc_count = docs.length;
		//nodescript.runNodeScriptInContext("init", node, sandbox, io);

		async.eachSeries(docs, function iterator(doc, next) {
			//joinMultipleValues(doc, node.settings.arr_sep);
			//nodescript.runNodeScriptInContext("run", node, sandbox, io);
			sandbox.context.doc = doc;
			sandbox.run.runInContext(sandbox);
			writer.write(sandbox.out.value);
			next();			

		}, function done() {
			nodescript.runNodeScriptInContext("finish", node, sandbox, io);
			writer.end();
			return;
		});
	});
}


// join
function joinMultipleValues (doc, arr_sep) {
	for(var key in doc) {
		
		if(key === '__mp_source' || key === '_id') {
			delete doc[key];
		} else {
			if(Array.isArray(doc[key])) {
				// if there are more than one row in array, then join them
				if(doc[key].length > 1) {
					var joined = doc[key].join(arr_sep);
					delete doc[key];
					doc[key] = joined;
				}
			}
		}
	}
}
