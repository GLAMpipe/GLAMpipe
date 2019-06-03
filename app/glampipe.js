var db 			= require('./db.js');
var project 	= require('./new_project.js');
var collection 	= require('./new_collection.js');
var Node 		= require('./new_node.js');
var schema 		= require('./new_schema.js');
const version 	= require("../config/version.js");

var debug 		= require('debug')('GLAMpipe');
var error 		= require('debug')('ERROR');

const mongoist 	= require('mongoist');
const path		= require('path');
const fs 		= require('fs');


class GLAMpipe {
	constructor(config) {
		try {
			global.config = require("../config/config.js");
			global.config.file = "config.js (your local settings)";
		} catch(e) {
			debug("config.js not found or is malformed!");
			global.config = require("../config/config.js.example");
			global.config.file = "config.js.example (default settings)";
		}
		
		if(config) {
			this.config = config;
			this.dataPath = path.join(config.dataPath, "glampipe-data");
			this.projectsPath = path.join(this.dataPath, "projects");
		} else if(global.config) {
			global.config.version = version.version;
			this.config = global.config;
			this.dataPath = path.join(global.config.dataPath, "glampipe-data");
			this.projectsPath = path.join(this.dataPath, "projects");
		} else {
			error("No config present!");
			throw("No config present!");
		}
	}

	async init(server) {
		console.log("GLAMpipe init started...")
		// load nodes from files
		await this.loadNodes();
		
		// create data directory structure
		if(!fs.existsSync("glampipe-data")) fs.mkdirSync("glampipe-data");
		if(!fs.existsSync("glampipe-data/projects")) fs.mkdirSync("glampipe-data/projects");
		if(!fs.existsSync("glampipe-data/logs")) fs.mkdirSync("glampipe-data/logs");
		if(!fs.existsSync("glampipe-data/tmp")) fs.mkdirSync("glampipe-data/tmp");
		if(!fs.existsSync("glampipe-data/uploads")) fs.mkdirSync("glampipe-data/uploads");
		
		// make sure that gp_settings collection exists
		var settings = await db.collection("gp_settings").findOne({});
		if(!settings) await db.collection("gp_settings").insert({"project_count":0, "data_path":""});
		
		if(server) {
			this.io	= require('socket.io')(server);
		}
	}


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

	
	async createEmptyProject(title) {
		return await project.create(title);
	}


	// create project from project data and execute nodes
	async createProject(data) {
		var new_project = await project.create(data.project_title);
		var collection = await this.createCollection(data.collection_title, new_project._id);
		for(const node in data.nodes) {
			var new_node = await this.createNode(data.nodes[node].nodeid, data.nodes[node].params, collection.collection, new_project._id);
			await new_node.run(data.nodes[node].settings);
		}
		
		return await this.getProject(new_project._id);
	}



	async getProjects() {
		return await project.getProjects();
	}



	async getProject(project_id) {
		return await project.getProject(project_id);
	}

	async deleteProject(project_id) {
		return await project.remove(project_id);
	}



/* ***********************************************************************
 * 							NODES
 * ***********************************************************************
*/

	async startNode(id, settings) {
		try {
			this.io.sockets.emit("progress", "NODE: running node ");
			var node = new Node();
			await node.loadFromProject(id);
			node.run(settings, this.io.sockets);
			
		} catch(e) {
			error("Node start failed! " + e.message);
			throw(e);
		}
	}

	async loadNodes() {
		var count = 0;
		var nodePath = path.join(global.config.nodePath, "/");
		debug("Loading nodes from " + path.join(global.config.nodePath, "/") );   
		// try to drop nodes collection (it does not exist in first run) 
		try {
			await db.collection("gp_nodes").drop();
		} catch(e) {
			console.log('no gp_nodes collection')
		}
		try {
			
			var dirs = fs.readdirSync(nodePath);
			for(var dir of dirs) {
				var dirPath = path.join(nodePath, dir);
				if (fs.statSync(dirPath).isDirectory()) {
					var nodeDirs = fs.readdirSync(dirPath);
					for(var nodeDir of nodeDirs) {
						var nodeDirPath = path.join(dirPath, nodeDir);
						if (fs.statSync(nodeDirPath).isDirectory()) {
							var nodeFiles = fs.readdirSync(nodeDirPath);
							// read only if description.json exists
							if(nodeFiles.includes('description.json')) {
								var content = fs.readFileSync(path.join(nodeDirPath, "description.json"), 'utf-8');
								var node = JSON.parse(content);
								if(node.core) { // require new GP-node format
									count++;
									for(var nodeFile of nodeFiles) {
										readNodeFile (nodeDirPath, nodeFile, node);
									}	
									await db["gp_nodes"].insert(node);
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
	}		


	async getFacet() {		
		return await db.collection("gp_nodes").find({}, {"nodeid":1, "title":1, "description":1, "type":1, "subtype":1});
	}


	async createCollection(title, project_id) {
		
		try {
			var project = await this.getProject(project_id);
			var collection_name = await collection.create(title, project);
			var collectionNode = new Node();
			await collectionNode.loadFromRepository("collection_basic");
			await collectionNode.setParams({"title": title})
			await collectionNode.add2Project(project._id, collection_name);
			debug("Collection created")
			return collectionNode;
		} catch(e) {
			error("Collection creation failed!", e);
			throw(e);
		}
	}


	async createNode(nodeid, params, collection_name, project_id) {

		try {
			var node = new Node();
			await node.loadFromRepository(nodeid);
			await node.setParams(params);
			await node.add2Project(project_id, collection_name);
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
			return node.removeFromProject(node.project);
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
 * 							MISC
 * ***********************************************************************
*/


	// needed if GLAMpipe is run from separate script
	closeDB() { 
		db.close(); 
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


module.exports = GLAMpipe ;
