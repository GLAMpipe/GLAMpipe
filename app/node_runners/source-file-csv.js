var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path        = require('path');
var mongoquery 	= require("../../app/mongo-query.js");
var collection = require("../../app/collection.js");
const MP 		= require("../../config/const.js");

var fs = require('fs');
var parse = require('csv-parse');
var transform = require('stream-transform');
var async = require('async');

var exports = module.exports = {};


exports.readToArray = function (node, sandbox, io, cb) {
	
	var download = sandbox.out.urls[0];
	var file= path.join(node.dir, download.filename);
	//var file = path.join(global.config.dataPath, "tmp", filename);
	var counter = 0;
	
	var records = []; // currently we create one huge array of records and insert that to Mongo

	var parser = parse({
		delimiter: node.settings.separator, 
		columns:true, 
		skip_empty_lines:true}, 
		function (err, data) {
		
			if(err) {
				console.log("ERROR:", err.message);
				io.sockets.emit("error", {nodeid:node.nodeid, msg:"Import failed! May be the separator is wrong?</br>" + err.message});
				return;
			}
			console.log("INITIAL IMPORT COUNT:", data.length);
			cb(data);
		}
	)
		

	parser.on('error', function(err){
	  console.log(err.message);
	});

	parser.on('finish', function(err){
		//cb();
	});

	fs.createReadStream(file, {encoding: node.settings.encoding}).pipe(parser);
	
}

/*
 * Parses CSV and adds language fields 
 * 
 * */
exports.importFile = function  (node, sandbox, io, cb) {

	var file = path.join(global.config.dataPath, "tmp", node.params.filename);
	var counter = 0;
	
	var records = []; // currently we create one huge array of records and insert that to Mongo

	var parser = parse({
		delimiter: node.settings.separator, 
		columns:true, 
		skip_empty_lines:true}, 
		function (err, data) {
		
		if(err) {
			console.log("ERROR:", err.message);
			io.sockets.emit("error", {nodeid:node.nodeid, msg:"Import failed! May be the separator is wrong?</br>" + err.message});
			return;
		}
			
		console.log("INITIAL IMPORT COUNT:", data.length);
		
		// if sample is set, then import only sample
		if(node.settings.sample_to) {
			console.log("TAKING SAMPLE OF:", node.settings.sample_to);
			var from = parseInt(node.settings.sample_from);
			var sample = parseInt(node.settings.sample_to);
			if(!isNaN(sample) && !isNaN(from))
				data = data.slice(from, from + sample);
		}
		
		async.eachSeries(data, function (record, callback) {
			
			var new_record = {};
			new_record[MP.source] = node._id;

			// create arrays for every key with clean field name
			for(var prop in record) {

				if (record.hasOwnProperty(prop)) {

					prop_clean = cleanFieldName(prop);
					new_record[prop_clean] = [];

					// find language codes key names like "dc.title[en]"
					var re = /\[(.|..|)\]/g;
					var codes = re.exec(prop_trimmed);
					
					// add language code as a separate field
					if(codes != null) {
						new_record[prop_clean + "__lang"] = [];	
					}

				}
			}
			
			// push values to arrays
			for(var prop in record) {

				if (record.hasOwnProperty(prop)) {

					prop_clean = cleanFieldName(prop);
					new_record[prop_clean].push(record[prop]);
															
					// find language codes
					var re = /\[(.|..|)\]/g;
					var codes = re.exec(prop_trimmed);
					
					// push language codes
					if(codes != null) {
						if(codes[1] != "") {
							new_record[prop_clean + "__lang"].push(codes[1]);
						} else {
							new_record[prop_clean + "__lang"].push("");
						}
					}
				}
			}
			

			// next round
			records.push(new_record);
			counter++;
			callback();

		  

		}, function done () {
			console.log("NODE: Inserting " + counter + " records");
			
			// save to database
			mongoquery.insert(node.collection, records , function(error) {
				if(error) {
					console.log(error);
					runNodeScriptInContext("finish", node, sandbox, io);
				} else {
					runNodeScriptInContext("finish", node, sandbox, io);
				}
			})
			
		})
	})

	parser.on('error', function(err){
	  console.log(err.message);
	});

	fs.createReadStream(file, {encoding: node.settings.encoding}).pipe(parser);

}


function cleanFieldName (field) {

	// clean up key names (remove -. and convert spaces to underscores)
	prop_trimmed = field.trim();
	prop_clean = prop_trimmed.replace(/[\s-.]/g, '_');					
	
	// remove language code from field name
	return  prop_clean.replace(/\[(.|..|)\]/g, '');

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
