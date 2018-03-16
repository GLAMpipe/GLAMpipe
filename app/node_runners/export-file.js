
var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path        = require('path');
var async 		= require("async");
var fs 			= require('fs');
var mongoquery 	= require("../../app/mongo-query.js");
var collection = require("../../app/collection.js");
var nodescript = require("../../app/run-node-script.js");
const MP 		= require("../../config/const.js");


var exports = module.exports = {};

exports.collectionToFile = function (node, sandbox, io) {

	var start = "";
	var end = "";
	if(sandbox.context.node.settings.start)
		start = sandbox.context.node.settings.start;
	if(sandbox.context.node.settings.end)
		end = sandbox.context.node.settings.end;

	// make sure that we have an export filename
	if(node.params.file == "") {
		console.log("ERROR: filename missing!");
		io.sockets.emit("error", {"nodeid":node._id, "msg":"ERROR: filename missing! Re-create node and give file name."});
		return;
	}

	// we stream directly to file
	var fs = require('fs');
	var filePath = path.join(node.dir, node.params.required_file);
	var wstream = fs.createWriteStream(filePath);

	// find everything
	mongoquery.find2({}, node.collection, function (err, doc) {
		
		// tell node how many records was found
		sandbox.context.doc_count = doc.length;
		//nodescript.runNodeScriptInContext("init", node, sandbox, io);
		wstream.write(start + "\n");

		async.eachSeries(doc, function iterator(doc, next) {
			sandbox.context.doc = doc;
			sandbox.context.count++;
			sandbox.out.value = null;
			sandbox.run.runInContext(sandbox);
			if (sandbox.out.error !== null)  return;
			wstream.write(sandbox.out.value)
			next();
			
		}, function done() {
			nodescript.runNodeScriptInContext("finish", node, sandbox, io);
			wstream.write(sandbox.out.value);
			wstream.write(end);
			wstream.end();

			//mongoquery.markNodeAsExecuted(node);
			return;
		});
	});
}



exports.docToFile = function (doc, sandbox, next) {

	sandbox.run.runInContext(sandbox);

	if(sandbox.out.file) {
		var filePath = path.join(sandbox.context.node.dir, sandbox.out.file);
		var wstream = fs.createWriteStream(filePath);
		wstream.write(sandbox.out.text);
		wstream.end();
	}
	next();

}
