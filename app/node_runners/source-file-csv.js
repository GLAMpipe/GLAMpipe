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

	var parser = parse({delimiter: ',', columns:true}, function (err, data) {
		
		async.eachSeries(data, function (record, callback) {
			
			var new_record = {};

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
						new_record[prop_clean] = [];
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
				if(error.length) {
					console.log(error);
					callback();
				} else {
					counter++;
					callback();
				}
			})
		  

		}, function done () {
			console.log("Found "+ counter + " records");
		})
	})

	fs.createReadStream(file).pipe(parser);

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
