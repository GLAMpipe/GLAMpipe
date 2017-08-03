var mongojs		= require('mongojs');
const vm		= require('vm');
var path		= require('path');
var mongoquery	= require("../../app/mongo-query.js");
var collection	= require("../../app/collection.js");
const MP 		= require("../../config/const.js");
var pdfUtil		= require('pdf-to-text');


var exports = module.exports = {};


function toText2 (file, info, sandbox, cb) {	
	pdfUtil.pdfToText(file, {}, function(err, text) {
		if (err) {
			sandbox.out.error = err;
			return cb();
		} else {
			sandbox.context.data = {"info": info, "text": text}
			cb();
		}
	});
}

exports.pdf2text = function (doc, sandbox, next) {
	
	sandbox.pre_run.runInContext(sandbox);
	if(sandbox.out.error) {
		return next();
		
	} else {
		console.log("extracting text " + sandbox.out.pre_value);
		pdfUtil.info(sandbox.out.pre_value, function(err, info) {
			if (err) {
				sandbox.out.error = err;
				return next();
			} else {
				toText2(sandbox.out.pre_value, info, sandbox, next);
			}
		});
	}
}

// source import
function toText (file, info, sandbox) {	
	pdfUtil.pdfToText(file, {}, function(err, data) {
		if (err) {
			sandbox.out.error = err;
			//runNodeScriptInContext("finish", node, sandbox, io);
			//sandbox.finish.runInContext(sandbox);
		} else {
			// save to database
			var record = {info:info, text:data, file:file, original_filename:node.params.file}
			record[MP.source] = node._id;
			mongoquery.insert(node.collection, record , function(error) {
				if(error) {
					console.log(error);
					runNodeScriptInContext("finish", node, sandbox, io);
				} else {
					runNodeScriptInContext("finish", node, sandbox, io);
				}
			})

			// save to file
			var file_out = path.join(node.dir, node.params.filename + ".txt");
			var fs = require('fs');
			fs.writeFile(file_out, data, function(err) {
				if(err) {
					return console.log(err);
				}
				console.log("The file was saved!");
			}); 
		}
	});
}




exports.extractText = function (node, sandbox, io) {
	var pdfUtil = require('pdf-to-text');
	//sandbox.pre_run.runInContext(sandbox);
	var file = path.join(global.config.dataPath, "tmp", node.params.filename);
	

	pdfUtil.info(file, function(err, info) {
		if (err)
			throw(err)
		
		toText(file, info, sandbox);
	});

	console.log("extracting text" + file);
}

exports.extractReferences = function (doc, sandbox, next) {

	var fs = require("fs");
	var StreamSplitter = require("stream-splitter");

	sandbox.context.doc = doc;
	sandbox.context.count++;
	sandbox.out.value = null;  // reset output
	
	// ask node pdf location
	sandbox.pre_run.runInContext(sandbox);
	console.log(sandbox.out.value);

	const spawn = require('child_process').spawn;
	// feed pdf location to pdfx with json option (-j)
	const ls = spawn('pdfx', [sandbox.out.value, '-j']);


	// we pipe stdout to an array
	var result_arr = [];
	var splitter = ls.stdout.pipe(StreamSplitter("\n"));
	splitter.encoding = "utf8";

	splitter.on("token", function(token) {
		result_arr.push(token);
	});

	splitter.on("done", function() {
		try {
			var result = JSON.parse(result_arr.join("\n"));
			console.log("pages:",result.metadata.Pages);
			sandbox.context.data = result; 
		// if json parse fails, then there were some kind of error in extraction
		} catch (e) {
			console.log(e);
			sandbox.context.data = {error: "ERROR"};
		}
		
		sandbox.run.runInContext(sandbox);
		next();
		
	});

	ls.stderr.on('data', (data) => {
	  console.log(`stderr: ${data}`);
	});

	ls.on('close', (code) => {
	  console.log(`pdfx exited with code ${code}`);
	});
	}


exports.pdf2image = function (doc, sandbox, next) {
	
	var PDFImage = require("pdf-image").PDFImage;
	var options = {outputDirectory: sandbox.context.node.dir};
	var pdfImage = new PDFImage(doc, options);
	pdfImage.convertPage(0).then(function (imagePath) {
		sandbox.context.data = imagePath;
		//fs.existsSync("/tmp/slide-0.png") // => true 
		next();
	}).catch(function(error) {
		console.log("ERROR: "+ error.message);
		next();
	});

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
