
var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path        = require('path');
var async 		= require("async");
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



	// we stream directly to file
	var fs = require('fs');
	var zip = new require('node-zip')();
	var filePath = path.join(node.dir, "testi.zip");

	// find everything
	mongoquery.find2({}, node.collection, function (err, docs) {
		
		// tell node how many records was found
		sandbox.context.doc_count = docs.length;

		async.eachSeries(docs, function iterator(doc, next) {
			sandbox.context.doc = doc;
			sandbox.run.runInContext(sandbox);
			console.log(doc['image_url_download'][0])
			zip.file(doc['image_url_download'][0],"sdf");
			next();			

		}, function done() {
			nodescript.runNodeScriptInContext("finish", node, sandbox, io);
			console.log("loppu")
			var data = zip.generate({base64:false,compression:'DEFLATE'});
			console.log(data)
			fs.writeFileSync('test.zip', data, 'binary');
			return;
		});
	});
}

