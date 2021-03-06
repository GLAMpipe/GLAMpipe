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
		console.log(sandbox.context.data)
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

exports.getBase64 = function(file, sandbox, cb) {
	
	fs.readFile(file, function(err, contents) {
		if(!err) {
			sandbox.context.data = contents.toString('base64');
		} else {
			console.log(err);
		}
		cb();
	});

}


// convert files with Pandoc
exports.convert = function (doc, sandbox, next) {
	
	var pandoc = require("node-pandoc");
	var src = "/home/arihayri/Downloads/paper.pdf";
	var args = "pandoc -s -o /home/arihayri/Downloads/paper.html";
	
	var options = {outputDirectory: sandbox.context.node.dir};
	
	pandoc(src, args, function(err, result) {
		
	})
	
	pandoc.convertPage(0).then(function (imagePath) {
		sandbox.context.data = imagePath;
		//fs.existsSync("/tmp/slide-0.png") // => true 
		next();
	}).catch(function(error) {
		console.log("ERROR: "+ error.message);
		next();
	});

}
