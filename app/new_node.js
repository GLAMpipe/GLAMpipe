

var colors 		= require('ansicolors');
const vm 		= require('vm');
const mongoist 	= require('mongoist');
var debug 		= require('debug')('GLAMpipe:node');
var error 		= require('debug')('GLAMpipe:error');

var db 			= require('./db.js');
var schema 		= require('./new_schema.js');
var buildquery 	= require("../app/query-builder.js");

var importLoop 	= require("../app/core-source.js");
var viewLoop 	= require("../app/core-view.js");
var processLoop = require("../app/core-process.js");
var lookupLoop 	= require("../app/core-lookup.js");
var exportLoop 	= require("../app/core-export.js");
var dbcore 		= require("../app/core-db.js");

var path 					= require("path");
var stringSimilarity 		= require("string-similarity");

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
		var project = null;
		try {
			project = await this.getProjectByNode(id);
		} catch(e) {
			throw(new Error('GLAMpipe node not found: ' + id))
		}
		var index = indexByKeyValue(project.nodes, project._nodeindex, id);
		this.source = project.nodes[index];

		this.uuid = id;
		this.collection = this.source.collection;
		this.project = project._id;
		this.project_obj = project;
		//this.project_dir = project.dir;

	}
	
	
	// get project by node id or label
	async getProjectByNode(id) {
		var project = await db.collection('gp_projects').findOne({"nodes.label": id});	
		if(!project){
			project = await db.collection('gp_projects').findOne({"nodes._id": mongoist.ObjectId(id)});
			project._nodeindex = '_id'
		} else {
			project._nodeindex = 'label'
		}
		return project;	
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
		await db.collection("gp_projects").update(
			{_id:mongoist.ObjectId(project_id)}, 
			{
				$push:{nodes: this.source},
				$inc: {'node_count':1}
			});	

		// these are just shorthands
		this.collection = collection_name;
		this.project = project_id;
		this.uuid = this.source._id;
	}
	

	async writeDir(project_id) {
		if(this.source.type != 'process') {
			const fs = require('fs');
			var project = await db.collection('gp_projects').findOne({"_id": mongoist.ObjectId(project_id)});
			if(project.dir) {
				var dir = path.join(global.config.projectsPath, project.dir, this.source.type,  this.source.nodeid + "_" + project.node_count );
				fs.mkdirSync(dir);
				await this.updateSourceKey('project_dir', dir);
			}
		}
	}

	async removeFromProject(project_id) {
		
		// remove records that were created by source node
		if(this.source.type == 'source') {
			var query = {};
			query[GP.source] = this.uuid;
			await db.collection(this.collection).remove(query);
		}
		
		// remove out_ fields created by node
		if(this.source.type != 'source') {
			var del_keys = {};
			for(var key in this.source.params) {
				console.log(key)
				if(/^out_/.test(key) && this.source.params[key] && this.source.params[key] !== "") {
					del_keys[this.source.params[key]] = "";
				}
			}
			if(Object.keys(del_keys).length !== 0) {
				var query = {};
				query["$unset"] = del_keys;
				console.log(query)
				await db.collection(this.collection).update({}, query, {'multi': true});
			}
		}
		
		// update schema
		//await schema.createSchema(this.collection);

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

	async setDescription(body) {
		await this.updateSourceKey('node_description', body.description);
	}

	async setLabel(label) {
		await this.updateSourceKey('label', label);
	}

	async updateSourceKey(key, value) {
		var setter = {'$set':''};
		var a = {}
		a["nodes.$." + key] = value;
		setter.$set = a;
		var query = {"nodes._id": mongoist.ObjectId(this.uuid)};
		await db.collection("gp_projects").update(query, setter);
		this.source[key] = value;
	}

	getFilesIndex(ctx) {
		var source = path.join(this.source.project_dir, 'files', 'index.html')
		const fs = require('fs-extra');
		const src = fs.createReadStream(source);
		ctx.response.set("content-type", "text/html");
		ctx.body = src;
	}

	getFile(ctx) {
		const fs = require('fs-extra');
		var source = path.join(this.source.project_dir, 'files')
		if(ctx.params.dir === 'js') {
			source = path.join(source, 'js', ctx.params.file);
			ctx.response.set("content-type", "application/x-javascript");
		} else if(ctx.params.dir === 'css') {
			source = path.join(source, 'css', ctx.params.file);
			ctx.response.set("content-type", "text/css");
		} else if(ctx.params.dir === 'fonts') {
			source = path.join(source, 'fonts', ctx.params.file);
			ctx.response.set("content-type", "application/octet-stream");
		}

		const src = fs.createReadStream(source);
		ctx.body = src;
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
		setter.$set = {"nodes.$.settings": settings_copy};
		var query = {"nodes._id": mongoist.ObjectId(this.source._id)};
		await db.collection("gp_projects").update(query, setter);

	}
	
	getOptions(req) {
	
		return db.collection("gp_node_options").findOne({"nodeid": req.params.nodeid});

	}
	
	
	async run(options) {
		if(!this.source.core) throw("Node's description.json does not have 'core' property!")
		this.settings = options.settings;	
		this.options = options;
		
		await this.saveSettings(options.settings);
		
		// create context for GP node
		var sandbox = createSandbox(this.source);
		sandbox.context = {};
		sandbox.context.node = this.source;
		sandbox.context.node.settings = options.settings;
		sandbox.context.node.uuid = this.uuid;
		sandbox.context.vars = {counter:0};

		this.sandbox = sandbox;
		this.scripts = {};
		
		// socket.io
		if(options.ws) {
			sandbox.out.say = function(ch, msg) {
				options.ws.emit(ch, {
					'msg':msg, 
					'project': sandbox.context.node.project,
					'node_uuid': sandbox.context.node.uuid,
				})
				
				// if we are ready, then remove node from register
				if(ch === 'finish') {
					if(global.register[sandbox.context.node.uuid])
						delete global.register[sandbox.context.node.uuid];
				}
			};
		} 
		
		// init node scripts
		this.scripts.init 		= CreateScriptVM(this.source, sandbox, "init");
		this.scripts.pre_run 	= CreateScriptVM(this.source, sandbox, "pre_run");
		this.scripts.run 		= CreateScriptVM(this.source, sandbox, "run");
		this.scripts.finish 	= CreateScriptVM(this.source, sandbox, "finish");
		this.scripts.login 		= CreateScriptVM(this.source, sandbox, "login");
			
		if(this.scripts.init) {
			try {
				this.scripts.init.runInContext(sandbox);
			} catch(e) {
				error(e)
				throw(new Error('Node script error (init) ' + e ))
			}
		}

		
		var core = this.source.core.split(".");
		switch(this.source.type) {

			case "source":
			
				// example core: web.get.JSON 
				await importLoop[ core[0] ][ core[1] ][ core[2] ](this);
				//await schema.createSchema(this.collection);
				break;
				
			case "process":
				switch(this.source.subtype) {
					case "lookups":
						try {
							await lookupLoop[ core[0] ][ core[1] ][ core[2] ](this);
						} catch(e) {
							console.log(e.message)
						}
						break;
						
					case "collection":
						try {
							await dbcore[ core[0] ][ core[1] ][ core[2] ](this);
						} catch(e) {
							console.log(e.message)
						}
						break;

					default:
						try {
							await processLoop[ core[0] ][ core[1] ][ core[2] ](this);
						} catch(e) {
							console.log(e.message)
						}
					break;
				}
				break;

			case "export":
				await exportLoop[ core[0] ][ core[1] ][ core[2] ](this);
				break;
				
			case "view":
				await viewLoop[ core[0] ][ core[1] ][ core[2] ](this);
				break;

		}

		this.scripts.finish.runInContext(sandbox);
		debug("done")
	}
}

module.exports = Node ;




function CreateScriptVM(node, sandbox, scriptName) {
		
	// create scripts (this will catch syntax errors)
	try {
		var scriptVM = new vm.createScript(node.scripts[scriptName]);
	} catch (e) {
		error("ERROR:", node.scripts[scriptName]);
		error(e.stack);
		console.log(e.stack)
		//sandbox.out.say("error", "Error in node: 'run' script: " + e.name +" " + e.message);
		//sandbox.out.say("error", "Slap the node writer!");
	}
	return scriptVM;
	
}





function createSandbox(node) {

	var xmlparser = require('fast-xml-parser');
	
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
		funcs: {
			xmlparser: {'xml2json': function(p, options) {return xmlparser.parse(p, options)}},
			path: path,
			stringSimilarity: stringSimilarity
		},
		out: {
			self:this,
			value:"",
			setter:null,
			error: null,
			say: function(ch, msg) {console.log('say: ' + msg)},
			console:console,
			error_marker: 'AAAA_error:'
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
