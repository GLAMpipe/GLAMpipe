var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path        = require('path');
var mongoquery 	= require("../../app/mongo-query.js");
var collection = require("../../app/collection.js");
const MP 		= require("../../config/const.js");


var exports = module.exports = {};

/*
 * Parses CSV and adds language fields 
 * 
 * */
exports.importFile = function  (node, sandbox, io, cb) {

	var fs = require('fs');
	var parse = require('csv-parse');
	var transform = require('stream-transform');
	var file = path.join(global.config.dataPath, "tmp", node.params.filename);
	var async = require('async');
	var counter = 0;

	var parser = parse({delimiter: node.settings.separator, columns:true}, function (err, data) {
		
		if(err) {
			console.log("ERROR:", err);
			io.sockets.emit("error", {nodeid:node.nodeid, msg:"Import failed! May be the separator is wrong?</br>" + err});
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

					// find language codes
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
			
			// save to database
			mongoquery.insert(node.collection, new_record , function(error) {
				if(error) {
					console.log(error);
					callback();
				} else {
					counter++;
					callback();
				}
			})
		  

		}, function done () {
			console.log("Found "+ counter + " records");
			runNodeScriptInContext("finish", node, sandbox, io);
		})
	})

	//fs.createReadStream(file).pipe(utf8()).pipe(parser);
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
