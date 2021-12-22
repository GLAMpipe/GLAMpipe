const {database} 	= require("../config/config.json");
const mongo			= require('./db.js');

const project 		= require('./new_project.js');
const collection 	= require('./new_collection.js');
const Node 			= require('./new_node.js');
const schema 		= require('./new_schema.js');
const cron	 		= require('./cron.js');
const version 		= require("../config/version.js");

var debug 			= require('debug')('GLAMpipe');
var error 			= require('debug')('ERROR');

const mongoist 		= require('mongoist');
const path			= require('path');
const fs 			= require('fs').promises;
const os			= require('os')

var workerFarm 		= require('worker-farm');
var workers 		= null;



class GLAMpipe {
	constructor(config) {
		console.log('GLAMpipe constructor called...')
	}


	async loadConfig(config) {
		debug("Loading config...")
		try {
			var content = await fs.readFile("config/config.json", 'utf-8');
			var json = JSON.parse(content);
			global.config = json;
			global.config.dataPath = path.join(json.dataPath, "data");
			global.config.projectsPath = path.join(json.dataPath, "projects");
			global.config.file = "config.js (your local settings)";

		} catch(e) {
			try {
				var content = await fs.readFile("config/config.json.example", 'utf-8');
				var json = JSON.parse(content);
				global.config = json;
				global.config.dataPath = path.join(json.dataPath, "data");
				global.config.projectsPath = path.join(json.dataPath, "projects");
				global.config.file = "config.js.example (default settings)";

			} catch(e) {
				error("Could not find config file!")
				throw("Could not find config file!")
			}
		}
	}


	async init(server) {
		console.log("GLAMpipe init started...")

		await this.loadConfig();
		debug(global.config)
		global.db = mongo.init(global.config.database)

		// create data directory structure
		try{ await fs.mkdir("data") } catch(e) { debug("data exists" ) }
		try{ await fs.mkdir("data/projects") } catch(e) { debug("data exists/projects" ) }
		try{ await fs.mkdir("data/logs") } catch(e) { debug("data exists/logs" ) }
		try{ await fs.mkdir("data/tmp") } catch(e) { debug("data exists/tmp" ) }
		try{ await fs.mkdir("data/uploads") } catch(e) { debug("data exists/uploads" ) }

		// load nodes from files
		await this.loadNodes();
		global.register = {};

		// make sure that gp_settings collection exists
		var settings = await db.collection("gp_settings").findOne({});
		if(!settings) await db.collection("gp_settings").insert({"project_count":0, "data_path":""});

		// make sure that local user exists
		var user = await db.collection("gp_users").findOne({"user": "local@user"});
		if(!user) await db.collection("gp_users").insert({"user":"local@user", "password":"", "settings": {}});

		if(server) {
			var io = require('socket.io')(server);
			this.io	= io;
			global.io = io;
		}

		// this function is called when out.say() is called from child process
		var p = function(p) {
			p.on('message', (m) => {
				if(!m.owner) {
					if(global.register[m.node_uuid]) {
						global.register[m.node_uuid]['processed'] = global.register[m.node_uuid]['processed'] + m.counter;
					}
					m.msg = global.register[m.node_uuid]['processed'];
					m.processed = global.register[m.node_uuid]['processed'];
					io.sockets.emit("progress", m);
				}
			});
		}
		workers = workerFarm({onChild:p}, require.resolve('./new_node-farm.js'))
		//cron.init();
		console.log("GLAMpipe init ready!")

	}


	/* ***********************************************************************
	 * 							USERS
	 * ***********************************************************************
	*/

	async getCurrentUser() {
		if(global.config.authentication == 'none') return db.collection("gp_users").findOne({'user': 'local@user'});
	}

	async setUserCollectionFields(collection, fields ) {
		var user = await this.getCurrentUser()
		var r = await db.collection("gp_users").update({user: user.user, fields: {$elemMatch:{collection:collection}}}, {$pull: {fields:{collection:collection}}})

		var keys = await db.collection("gp_users").update({user: user.user}, {$addToSet:{fields:{collection: collection, fields: fields}}})
		//db.collection("gp_users").update( { "settings.collection": { $ne: collection } }, { $set: { qty: 20 } } )
	}

	/* ***********************************************************************
	 * 							SCHEMA
	 * ***********************************************************************
	*/

	async createSchema(collection_name) {
		return await schema.createSchema(collection_name);
	}


	async getSchema(collection_name) {
		return await schema.getSchema(collection_name);
	}

/* ***********************************************************************
 * 							OPTIONS
 * ***********************************************************************
*/

	async getOptions(label) {
		return db.collection("gp_node_options").findOne({'id': label});
	}

	async addOption(label, data) {
		var doc = await db.collection("gp_node_options").findOne({'label': label});
		if(doc) {
			await db['gp_node_options'].update({_id:mongoist.ObjectId(doc._id)}, {$addToSet: {data: data } })
		} else {
			return db.collection("gp_node_options").insert({"label":label, "data": [data]});
		}

	}

/* ***********************************************************************
 * 							PROJECTS
 * ***********************************************************************
*/


	async createEmptyProject(title, description='') {
		var proj = await project.create(title, description);
		return proj;
	}


	// create project from project data and execute nodes
	/*
	async createProject(data) {
		var new_project = await project.create(data.project_title);
		var collection = await this.createCollection(data.collection_title, new_project._id);
		console.log(collection)
		for(const node in data.nodes) {
			var new_node = await this.createNode(data.nodes[node].nodeid, data.nodes[node].params, collection.collection, new_project._id);
			await new_node.run(data.nodes[node].settings);
		}
		return await this.getProject(new_project._id);
	}
*/


	async getProjects() {
		return await project.getProjects();
	}

	async getProject(project_id) {
		return await project.getProject(project_id);
	}

	async editProject(project_id, body) {
		return await project.editProject(project_id, body);
	}

	async deleteProject(project_id) {
		return await project.remove(project_id);
	}

	getProjectLink(project_id) {
		return 'http://localhost:' + global.config.port + '/projects/' + project_id;
	}

/* ***********************************************************************
 * 							NODES
 * ***********************************************************************
*/

	isRunning(node_id) {
		if(global.register[node_id]) {
			// clean up register
			if(global.register[node_id].workers === 0) {
				delete global.register[node_id];
				return false;
			} else {
				return true;
			}
		}
	}

	async startNode(node_id, settings, doc_id) {
		try {
			this.io.sockets.emit("progress", "NODE: running node ");
			var node = new Node();
			await node.loadFromProject(node_id, true);

			if(this.isRunning(node_id))
				throw("Node is running");
			else
				global.register[node_id] = {settings: settings, processed: 0, workers:-1};

			// we run 'process' nodes in worker farm if enabled
			if(node.source.type === 'process' && global.config.enableWorkers && !doc_id)
				await this.startNodeFarm(node_id, settings, node)
			else {
				if(doc_id) settings["doc_id"] = doc_id;
				var result = await node.run({settings:settings, ws:this.io.sockets});
				if(doc_id) return result;
			}

		} catch(e) {
			delete global.register[node_id]; // remove from register
			throw(e);
		}
	}

	async startNodeFarm(id, settings, node) {
		let workerCount = os.cpus().length;
		if(Number.isInteger(global.config.workerCount)) workerCount =  global.config.workerCount;

		let docCount = await collection.getCount(node.collection, {});
		var batchSize = Math.floor(docCount/workerCount);
		var leftOver = docCount - workerCount * batchSize;

		console.log("Number of workers: " + workerCount)
		console.log("Number of documents: " + docCount)
		console.log("batch: " + batchSize)
		console.log("leftover: "  + leftOver)

		if(docCount > global.config.workerMinDocCount) {
			for(var i = 0; i < workerCount; i++) {
				var options = {
					id: id,
					settings: settings,
					offset: i*batchSize,
					limit:batchSize,
					total: docCount
				}
				// last worker should process all the rest documents
				if(i === workerCount-1) options.limit = 0;
				if(global.register[id].workers === -1) global.register[id].workers = 0;
				global.register[id].workers++;
				workers(options, function (err, outp) {
					global.register[id].workers--;  // this worker is done, decrease worker count

					// if we are the last worker, then wrap things up
					if(global.register[id].workers === 0) {
						var msg = 'All done! Processed ' + global.register[id].processed;
						console.log(msg);
						var say = {
							'msg':msg,
							'project': outp.project,
							'node_uuid': outp.uuid,
						}
						global.io.sockets.emit("finish", say);
						delete global.register[id];
					}
				})
			}
		} else {
			var options = {
				id: id,
				settings: settings
			}
			console.log(options)
			workers(options, function (err, outp) {
				console.log(outp)
			})
		}

		this.io.sockets.emit("progress", "NODE: running node in worker-farm ");

	}

	async loadNodes() {
		var count = 0;
		var nodePath = path.join(global.config.nodePath, "/");
		debug("Loading nodes from " + path.join(global.config.nodePath, "/") );
		// try to drop nodes collection (it does not exist in first run)
		try {
			await db.collection("gp_repository").drop();
		} catch(e) {
			console.log('no gp_repository collection')
		}
		try {

			var dirs = await fs.readdir(nodePath);
			for(var dir of dirs) {
				var dirPath = path.join(nodePath, dir);
				var stats = await fs.stat(dirPath)
				if (await stats.isDirectory(dirPath)) {
					var nodeDirs = await fs.readdir(dirPath);
					for(var nodeDir of nodeDirs) {
						var nodeDirPath = path.join(dirPath, nodeDir);
						var nodeStats = await fs.stat(nodeDirPath);
						if (await nodeStats.isDirectory()) {
							var nodeFiles = await fs.readdir(nodeDirPath);
							// read only if description.json exists
							if(nodeFiles.includes('description.json') && nodeFiles.includes('process.js')) {
								var content = await fs.readFile(path.join(nodeDirPath, "description.json"), 'utf-8');
								var node = JSON.parse(content);
								if(node.core && node.gp_ver && parseInt(node.gp_ver) >= 21) { // require new GP-node format
									count++;
									for(var nodeFile of nodeFiles) {
										readNodeFile (nodeDirPath, nodeFile, node);
									}
									await db["gp_repository"].insert(node);
								}
							}
						}
					}
				}
			}
		} catch(e) {
			console.log(e.message)
		}

		if(count === 0) console.log("** ERROR: No nodes loaded! Did you fetch the nodes? **")
		else console.log("* OK: Loaded " + count + " nodes from " + nodePath)
		debug("Loaded " + count + " nodes");
		return {loaded:count, path:global.config.nodePath};
	}


	async getFacet() {
		return await db.collection("gp_repository").find({}, {"nodeid":1, "title":1, "description":1, "type":1, "subtype":1});
	}


	async createCollection(title = 'My data', project_id) {

		debug("Creating collection ", title)
		try {
			if(typeof project_id != "string") {
				project_id = project_id.toString()
			}

			var project = await this.getProject(project_id);
			var collection_name = await collection.create(title, project);
			debug("Collection created")
			return {id: collection_name, title: title}
		} catch(e) {
			error("Collection creation failed!", e);
			throw(e);
		}
	}


	async deleteCollection(collection_name) {

		debug("Deleting collection ", collection_name)

		try {
			var result = await collection.removeFromProject(collection_name);
			return result;
		} catch(e) {
			error("Collection deletion failed!", e);
			throw(e);
		}
	}

	async createNode(nodeid, params, collection_name, project_id) {

		try {
			if(typeof project_id != "string") {
				project_id = project_id.toString()
			}
			var node = new Node();
			await node.loadFromRepository(nodeid);
			await node.setParams(params);
			await node.add2Project(project_id, collection_name);
			await node.writeDir(project_id);
			return node;
		} catch(e) {
			error("Node creation failed!", e);
			throw(e);
		}
	}

	async removeNode(node_id) {
		try {
			var node = new Node();
			await node.loadFromProject(node_id);
			if(node.source.type == 'collection') {
				await collection.removeFromProject(node.collection, node.project);
			} else {
				await node.removeFromProject(node.project);
			}
			return {'status': 'ok'}
		} catch(e) {
			error("Node removal failed!", e);
			throw(e);
		}

	}


	async getNode(node_id) {
		var node = new Node();
		await node.loadFromProject(node_id);
		return node;
	}


	async getNodeScript(node_id, script) {
		try {
			var node = new Node();
			await node.loadFromProject(node_id);
			if(script)
				return node.source.scripts[script];
			else
				return node.source.scripts;

		} catch(e) {
			error("Node removal failed!", e);
			throw(e);
		}
	}


	async editNodeScript(node_uuid, scriptname, script) {
		try {
			var update = {}
			update['scripts.' + scriptname] = script.js
			collection.updateDoc('gp_nodes', node_uuid, update)
		} catch(e) {
			throw('Script editing failed')
		}
	}

	async revertNodeScript(node_uuid, scriptname) {

		try {
			var current = await this.getDocByQuery('gp_nodes', {'_id': mongoist.ObjectId(node_uuid)});
			var node = new Node();
			await node.loadFromRepository(current.nodeid);
			if(node.source.scripts[scriptname]) {
				await this.editNodeScript(node_uuid, scriptname, {js:node.source.scripts[scriptname]})
				return node.source.scripts[scriptname]
			} else {
				error(`Could not find node ${current.nodeid}`)
				throw('Revert failed!')
			}
		} catch(e) {
			error(`Reverting script ${scriptname} failed!`, e);
			throw(e);
		}
	}

	async getNodeSettingsTemplate(nodeid) {
		var xml2json = require("fast-xml-parser")
		var node = await this.getDocByQuery('gp_repository', {'nodeid': nodeid});
		let template = {};

		var l = xml2json.parse(node.views.settings, {ignoreAttributes:false});
		for(const setting of l.setting) {
			createSettingsTemplate(setting, "input", template)
			createSettingsTemplate(setting, "select", template)
			createSettingsTemplate(setting, "textarea", template)
		}
		return template;
	}

/* ***********************************************************************
 * 							PIPES
 * ***********************************************************************
*/


	async createPipe(name) {
		// check that id is not used
		if(name) {
			var doc = await db.collection('gp_pipes').findOne({'name': name});
			if(doc) {
				throw("Pipe called " + name + " exists")
			} else {
				if(!doc) await db.collection("gp_pipes").insert({"name":name, nodes: []});
			}
			return name;
		} else {
			throw("You must give pipe name as url parameters (?name=your_pipe_name )")
		}

	}


	async addNodes2Pipe(name, node_arr) {
		try {
			await db.collection("gp_pipes").update({"name":name}, {$set: {nodes: node_arr}});
			return db.collection('gp_pipes').findOne({'name': name});
		} catch(e) {
			throw("Pipe update failed: " + e)
		}
	}

	async getPipe(name) {
		return db.collection('gp_pipes').findOne({'name': name});
	}

	async getPipes() {
		return db.collection('gp_pipes').find({});
	}
/* ***********************************************************************
 * 							DATA
 * ***********************************************************************
*/


	async getDocByQuery(collection_name, query) {
		var doc = await db.collection(collection_name).findOne(query);
		if(doc) return doc;
		else return {};
	}

	async getDocs(collection_name, query) {
		var docs = await collection.getDocs(collection_name, query);
		if(docs) return docs;
		else return [];
	}

	async getDoc(collection_name, id) {
		return await collection.getDoc(collection_name, id);
	}

	async getDocCount(collection_name, query) {
		return await collection.getCount(collection_name, query);
	}

	async insertDoc(collection_name, doc) {
		return collection.insertDoc(collection_name, doc);
	}

	async updateDoc(collection_name, doc_id, data) {
		return collection.updateDoc(collection_name, doc_id, data);
	}

	async deleteDoc(collection_name, doc_id) {
		return collection.removeDoc(collection_name, doc_id);
	}

	async getCollections() {
		var collections = await db.getCollectionNames();
		return collections;
		// TODO: remove gp__ -collections
	}

	async getCollectionNodes(collection_name) {
		var nodes = await db.collection("gp_nodes").find({'collection': collection_name});
		// dynamically create "input" and "output" fields data
		for(var node of nodes) {
			node.output = []
			node.input = []
			if(node.params.out_field) node.output = [node.params.out_field]
			if(node.params.in_field) node.input = [node.params.in_field]
			// search fields stath start wiht "in_" from settings
			if(node.settings) {
				for(var key of Object.keys(node.settings)) {
					if(key.startsWith('in_')) node.input.push(node.settings[key])
				}
				if(node.settings.js) {
					var regex = /context\.doc\[['|"](.*?)['|"]/gm
					let m
					var lines = node.settings.js.split('\n')
					for(var str of lines) {
						while ((m = regex.exec(str)) !== null) {
						    // This is necessary to avoid infinite loops with zero-width matches
						    if (m.index === regex.lastIndex) {
						        regex.lastIndex++;
						    }
							console.log(m.length)
							console.log(m[1])
							if(m.length == 2) node.input.push(m[1])

						}
						//console.log('line:' + m)
						//console.log('match:' + match)
					}
				}
			}
		}

		for(var n of nodes) {
			if(!n.settings) n.settings = {}
			if(!n.settings.last_run) n.settings.last_run = 0 // make sure that nodes have settings and last_run set
		}

		// sort by last_run, latest run LAST
		nodes  = nodes.sort((a, b) => {
			if(!a.settings && !b.settings) return 0
			if(!a.settings) return -1
			if(!b.settings) return -1
			if ( a.settings.last_run < b.settings.last_run ){
				return -1;
			}
			if ( a.settings.last_run > b.settings.last_run ){
				return 1;
			}
			return 0;
		});

		// check validness
		var inputs2 = []
		var nodes2 = nodes.map((x) => x);
		for(var n of nodes) {
			for(var field of n.input) {
				for(var n2 of nodes2) {
					if(n2.output.includes(field)) n.error = 'old input'
				}
			}
			nodes2.shift()
		}

		return nodes;
	}

/* ***********************************************************************
 * 							FILES
 * ***********************************************************************
*/

	async uploadFile(file) {

		var size = formatBytes(file.size);
		var upload = {
			'filename': file.path,
			'mimetype': file.type,
			'original_filename': file.name,
			'size': size
			};
		var doc = await this.insertDoc('gp_uploads', upload);
		return doc;

	}

/* ***********************************************************************
 * 							CORES
 * ***********************************************************************
*/

	async getCores() {

		var source = require("../app/core-source.js");
		var process = require("../app/core-process.js");
		var exp = require("../app/core-export.js");
		var view = require("../app/core-view.js");
		var cores = [];
		cores = cores.concat(getDeepKeys(source));
		cores = cores.concat(getDeepKeys(process));
		cores = cores.concat(getDeepKeys(exp));
		cores = cores.concat(getDeepKeys(view));
		return cores;


	}


/* ***********************************************************************
 * 							CRON
 * ***********************************************************************
*/

	async createCronJob(node_uuid, body) {
		var settings = body.settings;
		var crontime = body.crontime;
		var job = await cron.createNodeJob(node_uuid, crontime, settings)
		return job;
	}

	async getCronJob(node_uuid) {
		return cron.getNodeJob(node_uuid);
	}

	async getJobs() {
		return cron.getJobs();
	}

/* ***********************************************************************
 * 							MISC
 * ***********************************************************************
*/


	// needed if GLAMpipe is run from separate script
	closeDB() {
		db.close();
	}

}


function createSettingsTemplate(setting, type, template) {

	if(Array.isArray(setting.settingaction[type])) {
		for(const input of setting.settingaction[type]) {
			createSettingsInfo(setting, input, template, type);
		}
	} else if(setting.settingaction[type]) {
		createSettingsInfo(setting, setting.settingaction[type], template, type);
	}
}

function createSettingsInfo(setting, input, template, type) {

	var info = {};
	if(input["@_class"] == "node-settings" && input["@_name"]) {
		info["element"] = input["@_type"] || 'unknown';
		info["value"] = input["@_checked"] || input["@_value"] || '';
		info["title"] = setting.settinginfo.settingtitle || '';
		info["help"] = setting.settinginfo.settinginstructions || '';

		if(type == "select") {
			info["element"] = "select";
			info["options"] = input.option;
		}
		if(type == "textarea") {
			info["element"] = "textarea";
		}
		template[input["@_name"]] = info;
	}
}

function readNodeFile (dirName, fileName, node) {

	var fs = fs || require('fs');
	var f = fileName.split(".");

	if (fs.statSync(path.join(dirName, fileName)).isDirectory()) return;

	var content = fs.readFileSync(path.join(dirName, fileName), 'utf-8')
	var lines = content.split("\n");
	for (var i = 0; i < lines.length; i++) {
		lines[i] = lines[i].replace('"', '\"');
		lines[i] = lines[i].replace('\t', '  ');
	}

	node.scripts = node.scripts || {};
	node.params = node.params || {};
	node.views = node.views || {};
	node.source_dir = dirName;
	// add javascript files to "scripts" section
	if(f[1] == "js") node.scripts[f[0]] = lines.join("\n");
	// add html files to "views" section
	if(f[1] == "html") node.views[f[0]] = lines.join("\n");


}


function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function getDeepKeys(obj) {
    var keys = [];
    for(var key in obj) {
        if(typeof obj[key] === "object") {
			for(var key2 in obj[key]) {
				if(typeof obj[key][key2] === "object") {
					for(var key3 in obj[key][key2]) {
						keys.push(key + "." + key2 + "." + key3)
					}
				}
			}
        }
    }
    return keys;
}

module.exports = GLAMpipe ;
