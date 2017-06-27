var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path        = require('path');
var fs 			= require("fs");
var crypto 		= require("crypto");


var exports = module.exports = {};

exports.getHash = function (file, sandbox, cb) {

	// the file you want to get the hash    
	try {
		var fd = fs.createReadStream(file);
	} catch(e) {
		sandbox.context.error = "Can not read file";
		return cb();
	}
	var hash = crypto.createHash('sha1');
	hash.setEncoding('hex');

	fd.on('end', function() {
		hash.end();
		sandbox.context.data = hash.read();
		cb();
	});

	fd.on("error", function() {
		console.log("Can not read file");
		sandbox.context.error = "Can not read file";
		cb("Can not read file");
	})

	hash.on("error", function() {
		console.log("Can not read file");
		sandbox.context.error = "Can not read file";
		cb("Can not read file");
	})

	// read all file and pipe it (write it) to the hash object
	fd.pipe(hash);
}

exports.getType = function(options, sandbox, cb) {

	const readChunk = require('read-chunk');
	const fileType = require('file-type');
	const buffer = readChunk.sync(options.file, 0, 4100);
	 
	sandbox.context.data = fileType(buffer);
	console.log(fileType(buffer))
	cb();

}
