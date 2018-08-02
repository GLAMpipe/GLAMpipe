

var colors 		= require('ansicolors');
var path 		= require("path");
const vm 		= require('vm');
const mongoist 	= require('mongoist');

var db 			= require('./db.js');
var schema 		= require('./new_schema.js');
var buildquery 	= require("../app/query-builder.js");
var dataImport 	= require("../app/import.js");
const MP 		= require("../config/const.js");


/*
 * - params {}
 * - settings {}
 * - source {}
 * - sandbox {}
 
 * - out
 
 * - project
 * - collection
 * - _id
 * 
 */


class Node {
	constructor() {
		console.log("new node")
	}



	async loadFromRepository(nodeid) {
		this.source = await db.collection("mp_nodes").findOne({"nodeid": nodeid});
		this.params = {};
		this.settings = {};
		if(!this.source) {
			throw("Loading node '" + nodeid + "' failed");
		}
		//console.log(this.source);
	}



	async loadFromProject(id) {
		var node = await db.collection('mp_projects').findOne({_id: mongoist.ObjectId(doc_id)});	
	}
	
	
	
	async add2Project(project_id, collection_name) {
		
		// check if collection exists
		var collections = await db.getCollectionNames();
		if(!collections.includes(collection_name)) {
			// create collection if node type is collection node
			if(this.source.nodeid == 'collection_basic') {
				await project.addCollection(collection_name);
			} else {
				throw("Collection does not exist");
			}
		}

		this.source.project = project_id;
		this.source.collection = collection_name;
		this.source._id = mongoist.ObjectId();
		var o = await db.collection("mp_projects").update({_id:mongoist.ObjectId(project_id)}, {$push:{nodes: this.source}});	
		
		// these are just shorthands
		this.collection = collection_name;
		this.project = project_id;
	}
	
	
	
	setParams(params) {
		if(this.source) {
			this.source.params = params; 
		} else {
			throw("Cannot set params!")
		}
		
	}



	async saveSettings(settings) {
		
		// we do not save passwords, user names and api keys
		if(settings) {
			if(settings.username) settings.username = null;
			if(settings.passwd) settings.passwd = null;
			if(settings.password) settings.password = null;
			if(settings.apikey) settings.apikey = null;
			if(settings.key_credential) settings.key_credential = null;
			if(settings.key_identity) settings.key_identity = null;
		}

		// we don't save empty setting values
		for(var key in settings) {
			if(!settings[key])
				delete settings[key];
		}

		if(!settings)
			return;
			
		var setter = {};
		setter.$set = {"nodes.$.settings": settings};
		var query = {"nodes._id": mongoist.ObjectId(this.source._id)};
		await db.collection("mp_projects").update(query, setter);
		
		this.source.settings = settings;
		//console.log(setter)

	}
	
	
	
	async run(settings, docid) {
	
		var core = this.source.core.split(".");
		await this.saveSettings(settings);
	
		// create context for GP node
		var sandbox = createSandbox(this.source);
		sandbox.context = {};
		sandbox.context.node = this.source;
		this.sandbox = sandbox;
		this.scripts = {};
		
		// init node scripts
		this.scripts.init 		= CreateScriptVM(this.source, sandbox, "init");
		this.scripts.pre_run 	= CreateScriptVM(this.source, sandbox, "pre_run");
		this.scripts.run 		= CreateScriptVM(this.source, sandbox, "run");
		this.scripts.finish 	= CreateScriptVM(this.source, sandbox, "finish");

		this.scripts.init.runInContext(sandbox);

		//console.log(this.source.type);
		switch(this.source.type) {

			case "source":
				await dataImport[ core[0] ][ core[1] ][ core[2] ](this);
				await schema.createSchema(this.collection);
				break;
				
			case "process":
				await dataLoop(this);
				break;
				
			case "export":
			
				break;
		}

		
		console.log("done")

	}
}

module.exports = Node ;





async function dataLoop(node) {

	var bulk = db[node.collection].initializeOrderedBulkOp();
    const cursor = db[node.collection].findAsCursor({});	
    
	while(await cursor.hasNext()) {
		var doc = await cursor.next();
	  
		node.sandbox.context.doc = doc;
		node.scripts.run.runInContext(node.sandbox);
	  
		bulk.find({ '_id': doc._id }).updateOne({
			'$set': { 'replaced': node.sandbox.out.value}
		});
	}	
	
	// make changes to database
	await bulk.execute();
}




function CreateScriptVM(node, sandbox, scriptName) {
		
	// create scripts (this will catch syntax errors)
	try {
		var scriptVM = new vm.createScript(node.scripts[scriptName]);
	} catch (e) {
		console.log("ERROR:", e.stack);
		console.log(node.scripts[scriptName]);
		//sandbox.out.say("error", "Error in node: 'run' script: " + e.name +" " + e.message);
		//sandbox.out.say("error", "Slap the node writer!");
	}
	return scriptVM;
	
}





function createSandbox(node) {


	var urljoin = require('url-join');
	// context for node scripts
	var sandbox = {
		context: {
			doc: null,
			data: null,
			vars: {},
			myvar: {},
			node: node,
			doc_count: 0,
			count: 0,
			success_count: 0,
			config: global.config
		},
		out: {
			self:this,
			options: {},
			error_marker: "AAAA_error:",
			value:"",
			setter:null,
			error: null,
			say: function(ch, msg) {console.log('say: ' + msg)},
			console:console
		}

	}
	return vm.createContext(sandbox);

	
}
