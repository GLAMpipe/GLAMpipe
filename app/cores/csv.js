const constants = require("../../config/const.js");
var schema 		= require('./../new_schema.js');
var path 		= require("path");

// TODO: rewrite this: https://stackoverflow.com/questions/33599688/how-to-use-es8-async-await-with-streams

exports.read = async function (node) {

	var fs = require('fs');
	var parse = require('csv-parse');
	var transform = require('stream-transform');

	if(node.sandbox.context.error) {
		node.sandbox.out.say("error", node.sandbox.context.error)
		return;
	}

	// remove previous entries by this node
	var query = {}; 
	query[constants.source] = node.uuid;
	await global.db[node.collection].remove(query);

	var file = path.join(node.source.project_dir, "files", node.source.params.filename);
	var connection_string = global.db_string;
	var db_string = "mongodb://" + connection_string;
	
	//var file = node.source.params.filename;
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
	var options = { dbURL: db_string, collection: node.collection }
	var streamToMongoDB = require('stream-to-mongo-db').streamToMongoDB;
	const mongoStream = streamToMongoDB(options);

	parser.on('data', function(c){
		count++;
		if(!(count % 1000)) console.log("CSV PARSER: " + count)
	});

	parser.on('finish', function(){
		console.log("CSV PARSER: " + count + " items parsed!");
	})

	parser.on('error', function(e){
		console.log(e.message);
		node.sandbox.out.say("error", e.message);
	})

	var transformer = transform(function(record){
		node.sandbox.context.data = record;
		node.scripts.process.runInContext(node.sandbox)
		if(node.sandbox.out.value) {
			node.sandbox.out.value[constants.source] = node.uuid; // mark source node uuid to records
		}
		return node.sandbox.out.value;
	})

	// promise	
	var end = new Promise(function(resolve, reject) {
		mongoStream.on('finish', () => {
			node.scripts.finish.runInContext(node.sandbox);
			schema.createSchema(node.collection);  // we don't wait schema creation
			resolve();
		})
		parser.on('error', reject); 
	});

	input.pipe(parser).pipe(transformer).pipe(mongoStream);

	return end;
	
}
