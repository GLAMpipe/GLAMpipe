var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path        = require('path');
var database 	= require('../../config/database');
var mongoquery 	= require("../../app/mongo-query.js");
var collection 	= require("../../app/collection.js");
const MP 		= require("../../config/const.js");

var fs 			= require('fs');
var parse 		= require('csv-parse');
var transform 	= require('stream-transform');
var async 		= require('async');

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
				return cb();
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



// import online CSV
exports.importUpdates = function (node, sandbox, download, io) {
	
	if(download.response.statusCode == 200) {
		// read data from CSV
		exports.readToArray(node, sandbox, io, function(data) {

			var new_records = [];
			// query update keys from db
			mongoquery.findDistinct({}, node.collection, node.settings.update_key, function(err, records) {
				// loop over parsed CSV data
				data.forEach(function(csv_item, j) {

					var update_key = csv_item[node.settings.update_key];
					if(records.indexOf(update_key) === -1) {
						csv_item.__mp_source = node._id;
						new_records.push(cleanKeys(csv_item)); // make sure all keys are lowercase
					}
				})
				
				//save to database
				if(new_records.length) {
					mongoquery.insert(node.collection, new_records, function(error) {
						if(error) {
							console.log(error);
							runNodeScriptInContext("finish", node, sandbox, io);
						} else {
							runNodeScriptInContext("finish", node, sandbox, io);
						}
					})
				} else {
					runNodeScriptInContext("finish", node, sandbox, io);
				}
			})
			
		});
	} else if(download.response.statusCode == 302) {
		io.sockets.emit("error", {nodeid:node.nodeid, msg:"Import failed (server said 302)! Check your password and username and CSV url"});

	}
}


exports.importFile_stream = function  (node, sandbox, io, cb) {

	var fs = require('fs');
	var parse = require('csv-parse');
	var transform = require('stream-transform');

	if(sandbox.context.error) {
		sandbox.out.say("error", sandbox.context.error)
		return;
	}

	//var file = path.join(global.config.dataPath, "tmp", node.params.filename);
	var file = sandbox.out.filename;
	var db = "mongodb://" + database.initDBConnect();
	var columns = null;
	var count = 0;
	if(node.settings.columns === "true")
		columns = true;
		
	var settings = {
		delimiter: node.settings.separator, 
		columns:columns, 
		relax: true,
		trim: true, // this could be optional
		skip_empty_lines:true
	} 
	
	if(node.settings.tabs === "true")
		settings.delimiter = "\t";

	var parser = parse(settings)
	
	var input = fs.createReadStream(file, {encoding: node.settings.encoding});
	var options = { db: db, collection: node.collection }
	var streamToMongo = require('stream-to-mongo')(options);

	parser.on('data', function(c){
		count++;
		if(!(count % 100)) console.log(count)
	});

	parser.on('finish', function(){
		console.log("PARSING DONE");
	})

	parser.on('error', function(e){
		console.log(e.message);
		sandbox.out.say("error", e.message);
	})

	streamToMongo.on('finish', function(){
		console.log("IMPORTING DONE! Imported " + count);
		runNodeScriptInContext("finish", node, sandbox, io);
	})

	var transformer = transform(function(record){
		sandbox.context.data = record;
		runNodeScriptInContext("run", node, sandbox, io);
		if(sandbox.out.value) {
			sandbox.out.value[MP.source] = node._id;
		}
		return sandbox.out.value;
	})

	if(node.settings.mode == "append") {
		mongoquery.findDistinct({}, node.collection, node.settings.update_key, function(err, records) {
			console.log(records);
			sandbox.context.records = records;
			input.pipe(parser).pipe(transformer).pipe(streamToMongo);
		})
	} else {
		input.pipe(parser).pipe(transformer).pipe(streamToMongo);
	}

	
	
}



/*
 * Parses CSV and adds language fields 
 * 
 * */
exports.importFile = function  (node, sandbox, io, cb) {

	var file = path.join(global.config.dataPath, "tmp", node.params.filename);
	var counter = 0;
	var columns = null;
	if(node.settings.columns === "true")
		columns = true;
	
	console.log("IMPORT STARTED...");
	var records = []; // currently we create one huge array of records and insert that to Mongo

	var parser = parse({
		delimiter: node.settings.separator, 
		columns:columns, 
		relax: true,
		trim: true, // this could be optional
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

/*
 * Parses CSV and adds language fields 
 * 
 * */
exports.importFileWithoutFieldNames = function  (node, sandbox, io, cb) {

	var file = path.join(global.config.dataPath, "tmp", node.params.filename);
	var counter = 0;
	
	var records = []; // currently we create one huge array of records and insert that to Mongo

	var parser = parse({
		delimiter: node.settings.separator, 
		columns:null, 
		skip_empty_lines:true}, 
		function (err, data) {
		
		if(err) {
			console.log("ERROR:", err.message);
			io.sockets.emit("error", {nodeid:node.nodeid, msg:"Import failed! May be the separator is wrong?</br>" + err.message});
			return;
		}
			
		console.log("INITIAL IMPORT COUNT:", data.length);
		console.log("columns:" + node.settings.columns);
		//console.log( arguments.callee.toString());
		
		
		async.eachSeries(data, function (record, callback) {
			
			var new_record = {};
			new_record[MP.source] = node._id;
			
			//console.log("rivi:" + record);
			//console.log(record);
			
			record.forEach(function (field, i) {
				console.log("field" + i);
			})
			
			callback();

		}, function done () {
			console.log("NODE: Inserting " + counter + " records");
			

			
		})
	})

	parser.on('error', function(err){
	  console.log(err.message);
	});

	fs.createReadStream(file, {encoding: node.settings.encoding}).pipe(parser);

}

function cleanKeys (record) {
	var new_rec = {}
	for(var prop in record) {
		if (record.hasOwnProperty(prop)) {
			var prop_clean = cleanFieldName(prop);
			new_rec[prop_clean] = record[prop];
		}
	}
	return new_rec;
}

function cleanFieldName (field) {

	// clean up key names (remove -. and convert spaces to underscores)
	prop_trimmed = field.trim().toLowerCase();
	prop_clean = prop_trimmed.replace(/[\s.]/g, '_');					
	
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
