var db 			= require('./db.js');
var project 	= require('./new_project.js');
var collection 	= require('./new_collection.js');
var Node 		= require('./new_node.js');
var schema 		= require('./new_schema.js');
const version 	= require("../config/version.js");

const mongoist 	= require('mongoist');
const path		= require('path');

class GLAMpipe {
	constructor(config) {

		try {
			global.config 		= require("../config/config.js");
			global.config.file = "config.js (your local settings)";
		} catch(e) {
			console.log("config.js not found or is malformed!");
			global.config 		= require("../config/config.js.example");
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
			throw("No config present!")
		}
		
		console.log("new GLAMpipe");
	}

	async init(cb) {
		await this.loadNodes();
	}

	test() {console.log("hey");}


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



	async createProject(data) {
		var new_project = await project.create(data.project_title);
		var collection = await this.createCollection(data.collection_title, new_project);
		for(const node in data.nodes) {
			var new_node = await this.createNode(data.nodes[node].nodeid, data.nodes[node].params, collection.collection, new_project);
			await new_node.run(data.nodes[node].settings);
		}
		
		return await this.getProject(new_project._id);
	}



	async getProjects() {
		return await project.getProjects();
	}



	async getProject(project_id) {
		console.log("Getting project: " + project_id)
		return await project.getProject(project_id);
	}

	async deleteProject(project_id) {
		console.log("Deleting project: " + project_id)
		return await project.remove(project_id);
	}



/* ***********************************************************************
 * 							NODES
 * ***********************************************************************
*/

	async loadNodes() {
		var nodePath = path.join(global.config.nodePath, "/");
		console.log("INIT: Loading nodes from " + path.join(global.config.nodePath, "/") );    
		try {
			await db.collection("gp_nodes").drop();
		} catch(e) {
			console.log(e.message);
		}
		var fs = fs || require('fs'),
		dirs = fs.readdirSync(nodePath);
		for(var dir of dirs) {
			var dirPath = path.join(nodePath, dir);
			if (fs.statSync(dirPath).isDirectory()) {
				//var content = fs.readFileSync(path.join(nodeDir, "description.json"), 'utf-8');
				var nodeDirs = fs.readdirSync(dirPath);
				for(var nodeDir of nodeDirs) {
					var nodeDirPath = path.join(dirPath, nodeDir);
					if (fs.statSync(nodeDirPath).isDirectory()) {
						var nodeFiles = fs.readdirSync(nodeDirPath);
						if(nodeFiles.includes('description.json')) {
							console.log(nodeDir)
							for(var nodeFile of nodeFiles) {
								//console.log(nodeFile)
							}						
						}
					}

				}				
			}

		}
	}		

	async getFacet() {
		
		return await db.collection("mp_nodes").find({}, {"nodeid":1, "title":1, "description":1, "type":1, "subtype":1});

	}


	async createCollection(title, project_id) {
		
		try {
			var project = await this.getProject(project_id)
			var collection_name = await collection.create(title, project);
			var collectionNode = new Node();
			await collectionNode.loadFromRepository("collection_basic");
			await collectionNode.setParams({"title": title})
			await collectionNode.add2Project(project._id, collection_name);
			console.log("Collection created")
			return collectionNode;
		} catch(e) {
			console.log("Collection creation failed!", e);
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
			console.log("Node creation failed!", e);
			throw(e);
		}	
	}

	async removeNode(project_id, node_id) {
		
		try {
			//var project = await this.getProject(project_id);
			var node = new Node();
			await node.loadFromProject(node_id);
			project.removeNode(project_id, node_id);
		} catch(e) {
			console.log("Node removal failed!", e);
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


module.exports = GLAMpipe ;
