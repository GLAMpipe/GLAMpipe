var db 			= require('./db.js');
var project 	= require('./new_project.js');
var collection 	= require('./new_collection.js');
var Node 		= require('./new_node.js');
var schema 		= require('./new_schema.js');

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
			this.config = global.config;
			this.dataPath = path.join(global.config.dataPath, "glampipe-data");
			this.projectsPath = path.join(this.dataPath, "projects");
		} else {
			throw("No config present!")
		}
		
		console.log("new GLAMpipe");
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



/* ***********************************************************************
 * 							NODES
 * ***********************************************************************
*/


	async createCollection(title, project) {

		try {
			var collection_name = await collection.create(title, project);
			var collectionNode = new Node();
			await collectionNode.loadFromRepository("collection_basic");
			await collectionNode.setParams({"title": title})
			await collectionNode.add2Project(project._id, collection_name);
			return collectionNode;
		} catch(e) {
			console.log("Collection creation failed!", e)
		}
	}


	async createNode(nodeid, params, collection, project) {

		try {
			var node = new Node();
			await node.loadFromRepository(nodeid);
			await node.setParams(params)
			await node.add2Project(project._id, collection);
			return node;
		} catch(e) {
			console.log("Node creation failed!", e)
		}	
	}

/* ***********************************************************************
 * 							DATA
 * ***********************************************************************
*/

	async getDocs(collection_name, query) {
		return await collection.getDocs(collection_name, query);
	}


	closeDB() { db.close(); }
}


module.exports = GLAMpipe ;
