

var async 		= require("async");
var colors 		= require('ansicolors');
var path 		= require("path");
var flatten 	= require("flat");
const vm 		= require('vm');
const mongoist = require('mongoist');

var db 			= require('./db.js');
var buildquery 	= require("../app/query-builder.js");

var dataImport 		= require("../app/import.js");
const MP 		= require("../config/const.js");


class Node {
	constructor() {
		console.log("new node")
	}



	async loadFromRepository(nodeid) {
		this.source = await db.collection("mp_nodes").findOne({"nodeid": nodeid});
		this.source.params = {};
		this.source.settings = {};
		//console.log(this.source);
	}



	async loadFromProject(id) {
		var node = await db.collection('mp_projects').findOne({_id: mongoist.ObjectId(doc_id)});	
	}
	
	
	
	async add2Project(project_id, collection_name) {
		
		// check if collection exists
		var collections = await db.getCollectionNames();
		if(!collections.includes(collection_name)) {
			// create collection if node is collection node
			if(this.source.nodeid == 'collection_basic') {
				await db.createCollection(collection_name);
			} else {
				throw("Collection does not exist");
			}
		}

		this.source.project = project_id;
		this.source.collection = collection_name;
		this.source.params.collection = collection_name;
		this.source._id = mongoist.ObjectId();
		var o = await db.collection("mp_projects").update({_id:mongoist.ObjectId(project_id)}, {$push:{nodes: this.source}});	
		console.log("project_id: " + project_id)
	}
	
	
	
	setParams(params) {
		if(this.source) {
			if(!params.collection && this.source.params && this.source.params.collection) { 
				params.collection = this.source.params.collection;
			}
			this.source.params = params;
		} else {
				throw("Cannot set params!")
		}
		
	}



	async saveSettings(node_id, settings) {
		
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
		var query = {"nodes._id": mongoist.ObjectId(node_id)};
		await db.collection("mp_projects").update(query, setter);

	}
	
	
	
	async run(settings, docid) {
		
		//dataImport.web.get.JSON();
	
		// create context for GP node
		var sandbox = createSandbox(this.source);
		// init node scripts
		var init 		= CreateScriptVM(this.source, sandbox, "init");
		sandbox.pre_run = CreateScriptVM(this.source, sandbox, "pre_run");
		sandbox.run 	= CreateScriptVM(this.source, sandbox, "run");
		sandbox.finish 	= CreateScriptVM(this.source, sandbox, "finish");

		init.runInContext(sandbox);

		// we quit in init_error
	//	if(sandbox.out.init_error) {
	//		sandbox.out.say("error", sandbox.out.init_error);
	//		return;
	//	}

		console.log(this.source.type);
		console.log(this.source.params.collection);
		
		
		const cursor = db.collection(this.source.params.collection).find({});
		console.log(typeof cursor);
		var doc = await cursor.next();
		while(doc) {
		  doc = await cursor.next();
		  console.log(doc)
		  // process doc here
		}
		// node run "router"
		if (this.source.type == 'process') {
			
		} else {
			
		}

	}
}

module.exports = Node ;

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
			error_marker: "AAAA_error:",
			pre_value:"",
			value:"",
			file:"",
			setter:null,
			error: null,
			say: function(msg) {console.log('say: ' + msg)},
			console:console
		}

	}
	return vm.createContext(sandbox);

	
}
