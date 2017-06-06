var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path        = require('path');
var fs 			= require("fs");
var crypto 		= require("crypto");


var exports = module.exports = {};

exports.getHash = function (file, sandbox, cb) {

	// the file you want to get the hash    
	var fd = fs.createReadStream(file);
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
		cb();
	})

	hash.on("error", function() {
		console.log("Can not read file");
		sandbox.context.error = "Can not read file";
		cb();
	})

	// read all file and pipe it (write it) to the hash object
	fd.pipe(hash);
}

