const constants = require("../../config/const.js");
var schema 		= require('./../new_schema.js');
var path 		= require("path");

// TODO: rewrite this: https://stackoverflow.com/questions/33599688/how-to-use-es8-async-await-with-streams

exports.read = async function (node) {

	var fs = require('fs');
	var MARC = require('marcjs');
	var transform = require('stream-transform');
	var count = 0;

	if(node.sandbox.context.error) {
		node.sandbox.out.say("error", node.sandbox.context.error)
		return;
	}

	// remove previous entries by this node
	var query = {}; 
	query[constants.source] = node.uuid;
	await global.db[node.collection].remove(query);

	//var file = path.join(global.config.dataPath, "tmp", node.params.filename);
	var connection_string = global.db_string;
	var db_string = "mongodb://" + connection_string;
	
	var file = path.join(node.source.project_dir, 'files', node.source.params.filename);
	let reader = MARC.stream(fs.createReadStream(file),'Iso2709');
	//let writable = MARC.stream(process.stdout, 'mij');
	

	//var input = fs.createReadStream(file, {encoding: node.settings.encoding});
	var options = { db: db_string, collection: node.collection }
	var streamToMongo = require('stream-to-mongo')(options);

	reader.on('data', function(c){
		count++;
		if(count % 100 === 0) console.log("MARC PARSER: " + count)
	});

	reader.on('end', function(){
		console.log("MARC PARSER: " + count + " items parsed!");
	})

	reader.on('error', function(e){
		console.log(e.message);
		node.sandbox.out.say("error", e.message);
	})

	// transform to MARC-in-JSON
	var transformer = transform(function(record){
		//console.log(record.as('mij'))
		var r = JSON.parse(record.as('mij'));
		r[constants.source] = node.uuid; // mark source node uuid to records
		return r; 
	});



	// promise	
	var end = new Promise(function(resolve, reject) {
		streamToMongo.on('finish', () => {
			node.scripts.finish.runInContext(node.sandbox);
			schema.createSchema(node.collection);  // we don't wait schema creation
			resolve();
		})
		//parser.on('error', reject); 
	});

	reader.pipe(transformer).pipe(streamToMongo)

	return end;
	
}
