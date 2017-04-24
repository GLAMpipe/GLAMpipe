var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path        = require('path');
var mongoquery 	= require("../../app/mongo-query.js");
var collection = require("../../app/collection.js");
const MP 		= require("../../config/const.js");


var exports = module.exports = {};


exports.extractText = function (node, sandbox, io) {
	var pdfUtil = require('pdf-to-text');
	//sandbox.pre_run.runInContext(sandbox);
	var file = path.join(global.config.dataPath, "tmp", node.params.filename);
	
	pdfUtil.pdfToText(file, {}, function(err, data) {
		if (err) {
			throw(err);
			
		} else {
			// save to database
			mongoquery.insert(node.collection, {text:data} , function(error) {
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
