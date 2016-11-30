var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path        = require('path');
var fs 			= require("fs");
var crypto 		= require("crypto");
var mongoquery 	= require("../../app/mongo-query.js");
var collection  = require("../../app/collection.js");
const MP 		= require("../../config/const.js");


var exports = module.exports = {};


exports.getHash = function (doc, sandbox, next) {

	sandbox.context.doc = doc;
	sandbox.context.count++;
	sandbox.out.value = null;  // reset output
	
	// ask node file location
	sandbox.pre_run.runInContext(sandbox);
	console.log(sandbox.out.value);

	// the file you want to get the hash    
	var fd = fs.createReadStream(sandbox.out.value);
	var hash = crypto.createHash('sha1');
	hash.setEncoding('hex');

	fd.on('end', function() {
		hash.end();
		var result = hash.read();
		console.log(hash.read()); // the desired sha1sum
		sandbox.context.data = result;
		sandbox.run.runInContext(sandbox); // pass result to node
		next();
	});

	// read all file and pipe it (write it) to the hash object
	fd.pipe(hash);
}



function runNodeScriptInContext (script, node, sandbox, io) {
	try {
		vm.runInNewContext(node.scripts[script], sandbox);
	} catch (e) {
		if (e instanceof SyntaxError) {
			console.log("Syntax error in node.scripts."+script+"!", e);
			io.sockets.emit("error", "Syntax error in node.scripts."+script+"!</br>" + e);
			throw new NodeScriptError("syntax error:" + e.message);
		} else {
			console.log("Error in node.scripts."+script+"!",e);
			io.sockets.emit("error", "Error in node.scripts."+script+"!</br>" + e);
			throw new NodeScriptError(e.message);
		}
	}
}

function NodeScriptError (message) {
	this.message = message;
	this.name = "NodeScriptError";
}
