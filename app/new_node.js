

var colors 		= require('ansicolors');
var path 		= require("path");
const vm 		= require('vm');
const mongoist 	= require('mongoist');
var debug 		= require('debug')('GLAMpipe:node');
var error 		= require('debug')('GLAMpipe:error');

var db 			= require('./db.js');
var schema 		= require('./new_schema.js');
var buildquery 	= require("../app/query-builder.js");
var dataImport 	= require("../app/import.js");
const GP 		= require("../config/const.js");


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
		
	}

	async loadFromRepository(nodeid) {
		this.source = await db.collection("gp_nodes").findOne({"nodeid": nodeid});
		this.params = {};
		this.settings = {};
		if(!this.source) {
			throw("Loading node '" + nodeid + "' failed");
		}
	}



	async loadFromProject(id) {
		var project = await db.collection('gp_projects').findOne({"nodes._id": mongoist.ObjectId(id)});	
		var index = indexByKeyValue(project.nodes, "_id", id);
		this.source = project.nodes[index];

		this.collection = this.source.collection;
		this.project = project._id;
		this.project_title = project.title;
		this.project_dir = project.dir;
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
		var o = await db.collection("gp_projects").update({_id:mongoist.ObjectId(project_id)}, {$push:{nodes: this.source}});	
		
		// these are just shorthands
		this.collection = collection_name;
		this.project = project_id;
	}
	

	async removeFromProject(project_id) {
		// remove records that were created by this node
		var query = {};
		query[GP.source] = this.source._id;
		await db.collection(this.collection).remove(query);
		
		// remove node from project
		var res = await db.collection("gp_projects").update(
			{_id:mongoist.ObjectId(project_id)},
			{$pull:{nodes: {_id:mongoist.ObjectId(this.source._id)}}});
		return res;
	}
	
	setParams(params) {
		if(this.source) {
			this.source.params = params; 
			if(!params) this.source.params = {};
		} else {
			throw("Cannot set params!")
		}
		
	}



	async saveSettings(settings) {

		// we make copy of settings that is saved to db so that we can remove certain fields (passwds etc.)
		// from it without affecting settings that are used by node
        var settings_copy = Object.assign({}, settings); 	

		// we do not save passwords, user names or api keys
		if(settings_copy) {
			if(settings_copy.username) settings_copy.username = null;
			if(settings_copy.passwd) settings_copy.passwd = null;
			if(settings_copy.password) settings_copy.password = null;
			if(settings_copy.apikey) settings_copy.apikey = null;
			if(settings_copy.key_credential) settings_copy.key_credential = null;
			if(settings_copy.key_identity) settings_copy.key_identity = null;
		}

		// we don't save empty setting values
		for(var key in settings_copy) {
			if(!settings_copy[key])
				delete settings_copy[key];
		}

		if(!settings_copy)
			return;
			
		var setter = {};
		setter.$set = {"nodes.$.settings_copy": settings_copy};
		var query = {"nodes._id": mongoist.ObjectId(this.source._id)};
		await db.collection("gp_projects").update(query, setter);

	}
	
	
	
	async run(settings, ws) {
		if(!this.source.core) throw("Node's description.json does not have 'core' property!")
		this.settings = settings;	
		
		await this.saveSettings(settings);
		
		// create context for GP node
		var sandbox = createSandbox(this.source);
		sandbox.context = {};
		sandbox.context.node = this.source;
		sandbox.context.node.settings = settings;
		this.sandbox = sandbox;
		this.scripts = {};
		
		// socket.io
		if(ws) sandbox.out.say = function(ch, msg) {ws(ch, msg)};
		
		// init node scripts
		this.scripts.init 		= CreateScriptVM(this.source, sandbox, "init");
		this.scripts.pre_run 	= CreateScriptVM(this.source, sandbox, "pre_run");
		this.scripts.run 		= CreateScriptVM(this.source, sandbox, "run");
		this.scripts.finish 	= CreateScriptVM(this.source, sandbox, "finish");

		try {
			this.scripts.init.runInContext(sandbox);
		} catch(e) {
			error(e)
		}
		
		var core = this.source.core.split(".");
		switch(this.source.type) {

			case "source":
			
				// example core: web.get.JSON 
				var p = await dataImport[ core[0] ][ core[1] ][ core[2] ](this);
				await schema.createSchema(this.collection);
				return p;
				break;
				
			case "process":
				await dataLoop(this);
				break;
				
			case "export":
			
				break;
		}

		
		debug("done")

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
		error("ERROR:", node.scripts[scriptName]);
		error(e.stack);
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
			node: node,
			doc_count: 0,
			count: 0,
			success_count: 0,
			config: global.config
		},
		GP: GP,
		core: {
			options: null
		},
		out: {
			self:this,
			value:"",
			setter:null,
			error: null,
			say: function(ch, msg) {console.log('say: ' + msg)},
			console:console
		}

	}
	return vm.createContext(sandbox);

	
}


function indexByKeyValue(arraytosearch, key, value) {

	for (var i = 0; i < arraytosearch.length; i++) {
		if (arraytosearch[i][key] == value) {
			return i;
		}
	}
	return null;
}
