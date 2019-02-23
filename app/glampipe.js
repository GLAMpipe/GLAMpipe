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

	async init() {
		// load nodes from files
		await this.loadNodes();
		// create data directory structure
		if(!fs.existsSync("glampipe-data")) fs.mkdirSync("glampipe-data");
		if(!fs.existsSync("glampipe-data/projects")) fs.mkdirSync("glampipe-data/projects");
		if(!fs.existsSync("glampipe-data/logs")) fs.mkdirSync("glampipe-data/logs");
		if(!fs.existsSync("glampipe-data/tmp")) fs.mkdirSync("glampipe-data/tmp");
		// make sure that gp_settings collection exists
		var settings = await db.collection("gp_settings").findOne({});
		if(!settings) await db.collection("gp_settings").insert({"project_count":0, "data_path":""});
	}

	async createSchema(collection_name) {
		return await schema.createSchema(collection_name);
	}

	async getSchema(collection_name) {
		return await schema.getSchema(collection_name);
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
			var node = new Node();
			await node.loadFromProject(id);
			node.run(settings);
		} catch(e) {
			error("Node start failed! " + e.message);
			throw(e);
		}
	}

	async loadNodes() {
		var count = 0;
		var nodePath = path.join(global.config.nodePath, "/");
		debug("Loading nodes from " + path.join(global.config.nodePath, "/") );    
		try {
			await db.collection("gp_nodes").drop();
		} catch(e) {
			error(e.message);
			throw(e);
		}
		
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

	async removeNode(project_id, node_id) {
	console.log('removing node')
		try {
			var node = new Node();
			await node.loadFromProject(node_id);
			await node.removeFromProject(project_id);
			//return project.removeNode(project_id, node_id);
		} catch(e) {
			error("Node removal failed!", e);
			throw(e);
		}
		
	}

/* ***********************************************************************
 * 							DATA
 * ***********************************************************************
*/

	async getDoc(collection_name, id) {
		return await collection.getDoc(collection_name, id);
	}

	async getDocs(collection_name, query) {
		return await collection.getDocs(collection_name, query);
	}

	async getDocCount(collection_name, query) {
		return await collection.getCount(collection_name, query);
	}


	//closeDB() { db.close(); }
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

module.exports = GLAMpipe ;
