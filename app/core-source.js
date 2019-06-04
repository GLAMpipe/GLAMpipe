

var requestPromise = require('request-promise-native');
const fetch = require('node-fetch');

var parse 		= require('csv-parse');
var transform 	= require('stream-transform');

var db = require('./db.js');
var schema 		= require('./new_schema.js');
const GP 		= require("../config/const.js");

var exports 	= module.exports = {};

exports.web = {

	"get": {
		"JSON": async function(node) {
			console.log("REQUEST:", node.sandbox.core.options.method + " -> " + node.sandbox.core.options.url);
			
			if(node.sandbox.core.options.headers) 
				node.sandbox.core.options.headers.Accept = "application/json";
			else
				node.sandbox.core.options.headers = {Accept: "application/json"};
											
			// we want statuscode	
			node.sandbox.core.options.resolveWithFullResponse = true;
				
			while(node.sandbox.core.options.url) {

				console.log(node.sandbox.core.options.url)
				try {
					var result = await requestPromise(node.sandbox.core.options);
					node.sandbox.core.response = result;
					node.sandbox.core.data = JSON.parse(result.body);

					node.sandbox.core.options.url = null; // reset url
					node.sandbox.core.error = null; // reset error
					

				// if request failes, then we pass error to node script so that it can decide what to do
				} catch(e) {
					node.sandbox.core.response = result;
					node.sandbox.core.error = e.message;
					console.log('ERROR: ' + e.message);
				}

				// handle data and get new options
				try {
					node.scripts.run.runInContext(node.sandbox);
				} catch(e) {
					console.log(e)
				}

				// write data
				if(node.sandbox.out.value) {
					markSourceNode(node.sandbox.out.value, node);
					await db[node.collection].insert(node.sandbox.out.value);
				}
			}
			node.scripts.finish.runInContext(node.sandbox);
		}
	}
}



exports.file = {

	"CSV": {
		// TODO: rewrite this: https://stackoverflow.com/questions/33599688/how-to-use-es8-async-await-with-streams
		"read": async function(node) {
			console.log("read CSV");


			var fs = require('fs');
			var parse = require('csv-parse');
			var transform = require('stream-transform');

			if(node.sandbox.context.error) {
				node.sandbox.out.say("error", node.sandbox.context.error)
				return;
			}

			// remove previous entries by this node
			var query = {}; 
			query[GP.source] = node.uuid;
			await db[node.collection].remove(query);

			//var file = path.join(global.config.dataPath, "tmp", node.params.filename);
			var connection_string = "127.0.0.1:27017/glampipe_rw" // FIX THIS!
			var db_string = "mongodb://" + connection_string;
			
			var file = node.source.params.filename;
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
			var options = { db: db_string, collection: node.collection }
			var streamToMongo = require('stream-to-mongo')(options);

			parser.on('data', function(c){
				count++;
				//if(!(count % 100)) console.log(count)
			});

			parser.on('finish', function(){
				console.log("PARSING DONE");
			})

			parser.on('error', function(e){
				console.log(e.message);
				node.sandbox.out.say("error", e.message);
			})

			// promise	
			var end = new Promise(function(resolve, reject) {
				streamToMongo.on('finish', () => resolve());
				parser.on('error', reject); 
			});
			
			//streamToMongo.on('finish', async function(){
			//	console.log("IMPORTING DONE! Imported " + count);
			//	node.scripts.finish.runInContext(node.sandbox)
			//	await schema.createSchema(node.collection);
			//})

			var transformer = transform(function(record){
				node.sandbox.context.data = record;
				node.scripts.run.runInContext(node.sandbox)
				if(node.sandbox.out.value) {
					node.sandbox.out.value[GP.source] = node.uuid;
				}
				return node.sandbox.out.value;
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
			return end;
		}
	}
}

function  markSourceNode(data, node) {
	if(Array.isArray(data)) {
		for(var d of data) {
			d[GP.source] = node.uuid;
		}
	} else {
		data[GP.source] = node.uuid
	}
}
