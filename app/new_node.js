

var colors 		= require('ansicolors');
const vm 		= require('vm');
const mongoist 	= require('mongoist');
var debug 		= require('debug')('GLAMpipe:node');
var error 		= require('debug')('GLAMpipe:error');

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
		this.source = await global.db.collection("gp_repository").findOne({"nodeid": nodeid});
		this.params = {};
		this.settings = {};
		if(!this.source) {
			throw("Loading node '" + nodeid + "' failed");
		}
	}


	async loadFromProject(id) {
		
		try {
			var node = await global.db.collection("gp_nodes").findOne({"_id": mongoist.ObjectId(id)});
		} catch(e) {
			throw(new Error('GLAMpipe node not found: ' + id))
		}
		
		this.source = node;
		this.uuid = id;
		this.collection = node.collection;
		this.project = node.project;
		//this.project_obj = project;
		//this.project_dir = project.dir;

	}

	
	async add2Project(project_id, collection_name) {
		// check that project exists
		var project = await global.db.collection('gp_projects').findOne({"_id": mongoist.ObjectId(project_id)});
		if(!project) throw("Project does not exist!")
		
		// check if collection exists
		var collections = await global.db.getCollectionNames();
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
		this.source.project_dir = path.join(global.config.projectsPath, project.dir, collection_name, this.source.type,  this.source.nodeid + "_" + project.node_count + 1 );
		console.log(this.source)
		var result = await global.db.collection('gp_nodes').insert(this.source);
		
		// increase node counter for node directory naming
		await global.db.collection("gp_projects").update(
			{_id:mongoist.ObjectId(project_id)}, 
			{$inc: {'node_count':1}
		});	

		// these are just shorthands
		this.collection = collection_name;
		this.project = project_id;
		this.uuid = this.source._id;
	}
	

	async writeDir(project_id) {

		const fs = require('fs');
		var project = await global.db.collection('gp_projects').findOne({"_id": mongoist.ObjectId(project_id)});
		if(project.dir) {
			//var dir = path.join(global.config.projectsPath, project.dir, this.source.type,  this.source.nodeid + "_" + project.node_count );
			fs.mkdirSync(this.source.project_dir);
			//await this.updateSourceKey('project_dir', dir);
		}
	}



	async removeFromProject() {
		
		// remove records that were created by source node
		if(this.source.type == 'source') {
			var query = {};
			query[GP.source] = this.uuid;
			await global.db.collection(this.collection).remove(query);
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
				await global.db.collection(this.collection).update({}, query, {'multi': true});
			}
		}
		
		// update schema
		//await schema.createSchema(this.collection);

		// remove node from project
		var res = await global.db.collection("gp_nodes").remove({_id:mongoist.ObjectId(this.source._id)});
		return res;
	}


	async upload(ctx) {
		
		var fs = require('fs');
		var fsp = require('fs').promises;
		var self = this;
		
		try { await fsp.mkdir(path.join(this.source.project_dir, "uploads")) } catch(e) { debug("upload dir exists" ) }
		var filename = Math.random().toString()
		var filepath = path.join(this.source.project_dir, 'uploads', filename)

		const file = ctx.request.files.file;
		const reader = fs.createReadStream(file.path);
		const stream = fs.createWriteStream(filepath);
		reader.pipe(stream);
		console.log('uploading %s -> %s', file.name, stream.path);

		reader.on('error', function(e){
			console.log(e.message);
		})

		// promise	
		var end = new Promise(function(resolve, reject) {
			stream.on('finish', async () => {
				console.log(self.source.params.file)
				//await self.setParams({'testi':'joo', file: self.source.params.file})
				self.source.params.filename = filename;
				await self.updateSourceKey('params', self.source.params);
				resolve();
			})
			stream.on('error', reject); 
		});


		return end;
	

		//try { await fs.mkdir(path.join("uploads")) } catch(e) { debug("upload dir exists" ) }
		//console.log(this.source.project_dir)
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
		a[key] = value;
		setter.$set = a;
		var query = {"_id": mongoist.ObjectId(this.uuid)};
		await global.db.collection("gp_nodes").update(query, setter);
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
		
		// we make copy of settings that is saved to db so that we can remove fields starting with underscore (passwds etc.)
		// from it without affecting settings that are used by node
        var settings_copy = Object.assign({}, settings); 	

		// we do not save passwords, user names or api keys
		if(settings_copy) {
			for(var setting in settings) {
				if(setting.startsWith("_")) settings_copy[setting] = null;
			}
		}

		// we don't save empty setting values
		for(var key in settings_copy) {
			if(!settings_copy[key])
				delete settings_copy[key];
		}

		if(!settings_copy)
			return;
		
		await this.updateSourceKey('settings', settings_copy);

	}
	
	getOptions(req) {
	
		return global.db.collection("gp_node_options").findOne({"nodeid": req.params.nodeid});

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
