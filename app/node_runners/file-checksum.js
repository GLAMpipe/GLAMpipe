var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path        = require('path');
var fs 			= require("fs");
var crypto 		= require("crypto");


var exports = module.exports = {};

exports.run = function (doc, sandbox, next) {

	sandbox.context.doc = doc;
	sandbox.context.count++;
	sandbox.out.value = null;  // reset output
	
	// ask node file location
	sandbox.pre_run.runInContext(sandbox);
	//console.log(sandbox.out.value);
	
	if(Array.isArray(sandbox.out.value)) {
		var result = [];
		// loop over array
		require("async").eachSeries(sandbox.out.value, function iterator (filename, arr_next) {

			getHash(filename, function(data) {
				result.push(data);
				arr_next();
			});

		}, function done () {
			sandbox.context.data = result;
			sandbox.run.runInContext(sandbox); // pass result to node
			next();
		})
		
	} else {
		getHash(sandbox.out.value, function(data) {
			sandbox.context.data = data;
			sandbox.run.runInContext(sandbox); // pass result to node
			next();
		});
	}
}

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

	// read all file and pipe it (write it) to the hash object
	fd.pipe(hash);
}

