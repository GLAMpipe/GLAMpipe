

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

var path 				= require("path");
var stringSimilarity 	= require("string-similarity");

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


	async loadFromProject(id, allow_devmode) {

		try {
			var node = await global.db.collection("gp_nodes").findOne({"_id": mongoist.ObjectId(id)});
			if(global.config.devmode && allow_devmode) {
				var source = await global.db.collection("gp_repository").findOne({"nodeid": node.nodeid});
				source.settings = node.settings
				source.params = node.params
				source.project_dir = node.project_dir
				source.project = node.project
				source.collection = node.collection
				source.type = node.type
			}

		} catch(e) {
			throw(new Error('GLAMpipe node not found: ' + id))
		}

		if(source) this.source = source;
		else this.source = node
		this.uuid = id;
		this.collection = node.collection;
		this.project = node.project;

	}


	async add2Project(project_id, collection_name) {
		// check that project exists
		var project = await global.db.collection('gp_projects').findOne({"_id": project_id});
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
		this.source.project_dir = path.join(global.config.projectsPath, project.dir, collection_name, this.source.type,  this.source.nodeid + "_" + (project.node_count + 1) );
		// set out_field to schema
		this.source.schema = {};
		for(var key in this.source.params) {
			if(/^out_/.test(key)) this.source.schema[this.source.params[key]] = [];
		}

		var result = await global.db.collection('gp_nodes').insert(this.source);

		// increase node counter for node directory naming
		await global.db.collection("gp_projects").update(
			{_id:project_id},
			{$inc: {'node_count':1}
		});

		// these are just shorthands
		this.collection = collection_name;
		this.project = project_id;
		this.uuid = this.source._id;
	}


	async writeDir(project_id) {
		const fs = require('fs-extra');
		var project = await global.db.collection('gp_projects').findOne({"_id": project_id});
		if(project.dir) {
			try {
				//var dir = path.join(global.config.projectsPath, project.dir, this.source.type,  this.source.nodeid + "_" + project.node_count );
				await fs.mkdir(this.source.project_dir);
				await fs.mkdir(path.join(this.source.project_dir, 'files'));
				await fs.mkdir(path.join(this.source.project_dir, 'public'));
				for(var nodefile in this.source.scripts) {
					var file = path.join(this.source.project_dir, nodefile) + '.js'
					await fs.writeFile(file, this.source.scripts[nodefile]);
				}
				for(var uifile in this.source.views) {
					if(['params', 'settings'].includes(uifile)) {
						var file = path.join(this.source.project_dir, uifile) + '.html'
						await fs.writeFile(file, this.source.views[uifile]);
					}
				}
				var file = path.join(this.source.project_dir, 'params.json')
				await fs.writeFile(file, JSON.stringify(this.source.params));

				if(this.source.settings) {
					var file = path.join(this.source.project_dir, 'settings.json')
					await fs.writeFile(file, JSON.stringify(this.source.settings));
				}

				// copy 'public' directory from node source to node's project directory (html + css + js)
				try {
					var source = path.join(this.source.source_dir, 'public');
					var target = path.join(this.source.project_dir, 'public');
					await fs.copy(source, target);
				} catch(e) {
					debug('Node has no public directory')
				}
			} catch(e) {
				throw('Node directory creation failed! ' + e)
			}
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
				if(/^out_/.test(key) && this.source.params[key] && this.source.params[key] !== "") {
					del_keys[this.source.params[key]] = "";
				}
			}
			if(Object.keys(del_keys).length !== 0) {
				var query = {};
				query["$unset"] = del_keys;
				await global.db.collection(this.collection).update({}, query, {'multi': true});
			}
		}

		// update schema
		await schema.createSchema(this.collection);

		// remove node from project
		var res = await global.db.collection("gp_nodes").remove({_id:mongoist.ObjectId(this.source._id)});
		return res;
	}


	async upload(ctx) {

		var fs = require('fs');
		var fsp = require('fs').promises;
		var self = this;

		try { await fsp.mkdir(path.join(this.source.project_dir, "files")) } catch(e) { debug("'files' dir exists" ) }

		const file = ctx.request.files.file;

		var today = new Date(Date.now());
		var mm = String(today.getMonth() + 1).padStart(2, '0');
		var d = String(today.getDate()).padStart(2, '0');
		var h = String(today.getHours());
		var m = String(today.getMinutes()).padStart(2, '0');
		var s = String(today.getSeconds()).padStart(2, '0');
		var ms = String(today.getMilliseconds());
		var filename = today.getUTCFullYear() + '-' + mm + '-' + d + '-' + h + ':' + m + ':' + s  +'_' + ms + path.extname(file.name)
		var filepath = path.join(this.source.project_dir, 'files', filename)

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

	getPublicIndex(ctx) {
		var source = path.join(this.source.project_dir, 'public', 'index.html')
		const fs = require('fs-extra');
		const src = fs.createReadStream(source);
		ctx.response.set("content-type", "text/html");
		ctx.body = src;
	}

	getPublicFile(ctx) {
		const fs = require('fs-extra');
		var source = path.join(this.source.project_dir, 'public')
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

	getFile(ctx, file) {
		var source = path.join(this.source.project_dir, 'files', file)
		const fs = require('fs-extra');
		const src = fs.createReadStream(source);
		ctx.response.set("content-type", "text/html");
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

		// write to file
		try {
			var fs = require("fs-extra")
			var file = path.join(this.source.project_dir, 'settings.json')
			await fs.writeFile(file, JSON.stringify(settings_copy, null, 4));
		} catch(e) {
			console.log('settings.json not written ' + e)
		}

		// save the script of script node
		if(this.source.nodeid === 'process_script' && settings.js) {
			try {
				var js = path.join(this.source.project_dir, 'process.js')
				await fs.writeFile(js, settings.js);
			} catch(e) {
				console.log('process.js not written ' + e)
			}
		}

	}

	getOptions(req) {

		return global.db.collection("gp_node_options").findOne({"nodeid": req.params.nodeid});

	}


	async run(options) {
		if(!this.source.core) throw("Node's description.json does not have 'core' property!")
		debug("node type: " + this.source.type)
		debug("node core: " + this.source.core)
		debug(options.settings)
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
		sandbox.context.startTime = process.hrtime()
		console.log(sandbox.context.startTime)

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
		this.scripts.login 		= CreateScriptVM(this.source, sandbox, "login");
		this.scripts.options 	= CreateScriptVM(this.source, sandbox, "options");
		this.scripts.process 	= CreateScriptVM(this.source, sandbox, "process");
		this.scripts.finish 	= CreateScriptVM(this.source, sandbox, "finish");

		if(this.scripts.init) {
			try {
				this.scripts.init.runInContext(sandbox);
			} catch(e) {
				error(e)
				throw(new Error('Init script error ' + e ))
			}
		}

		var core = this.source.core.split(".");
		switch(this.source.type) {

			case "source":

				// example core: web.get.JSON
				try {
					await importLoop[ core[0] ][ core[1] ][ core[2] ](this);
				} catch(e) {
					this.sandbox.out.say("error", "Error in import: " + e.message);
				}
				//await schema.createSchema(this.collection);
				break;

			case "process":
				switch(this.source.subtype) {
					case "lookups":
						try {
							await lookupLoop[ core[0] ][ core[1] ][ core[2] ](this);
						} catch(e) {
							console.log(e.message)
							this.sandbox.out.say("error", "Error in lookup: " + e.message);
						}
						break;

					case "collection":
						try {
							await dbcore[ core[0] ][ core[1] ][ core[2] ](this);
						} catch(e) {
							console.log(e.message)
							this.sandbox.out.say("error", "Error: " + e.message);
						}
						break;

					default:
						try {
							await processLoop[ core[0] ][ core[1] ][ core[2] ](this);
						} catch(e) {
							console.log(e.message)
							this.sandbox.out.say("error", "Error: " + e.message);
						}
					break;
				}
				break;

			case "export":
				try {
					await exportLoop[ core[0] ][ core[1] ][ core[2] ](this);
				} catch(e) {
					this.sandbox.out.say("error", "Error in export: " + e.message);
				}
				break;

			case "view":
				try {
					await viewLoop[ core[0] ][ core[1] ][ core[2] ](this);

				} catch(e) {
					this.sandbox.out.say("error", "Error in view creation: " + e.message);
				}
				break;

		}

		this.scripts.finish.runInContext(sandbox);
		debug("done")
		if(this.sandbox.out.setter) return this.sandbox.out.setter

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

	var xmlparser = require('fast-xml-parser')
	var validator = require('validator')

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
			validator: validator,
			stringSimilarity: stringSimilarity
		},
		out: {
			self:this,
			value:"",
			setter:null,
			error: null,
			//say: function(ch, msg) {console.log('say: ' + msg)},
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
