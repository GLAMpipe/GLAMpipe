

var async 		= require("async");
var colors 		= require('ansicolors');
var path 		= require("path");
var flatten 	= require("flat");
const vm 		= require('vm');
const mongoist = require('mongoist');

var db 			= require('./db.js');
var buildquery 	= require("../app/query-builder.js");
const MP 		= require("../config/const.js");


class Node {
	constructor() {
		console.log("new node")
	}

	async loadFromRepository(nodeid) {
		this.source = await db.collection("mp_nodes").findOne({"nodeid": nodeid});
		//console.log(this.source);
	}

	async loadFromProject(id) {
		var node = await db.collection('mp_projects').findOne({_id: mongoist.ObjectId(doc_id)});	
	}
	
	async add2Project(project_id, collection_name) {
		this.source.project = project_id;
		this.source.collection = collection_name;
		var o = await db.collection("mp_projects").update({_id:mongoist.ObjectId(project_id)}, {$push:{nodes: this.source}});	
		console.log("project_id: " + project_id)
	}
	
	setParams(params) {
		if(this.source) {
			this.source.params = params;
		} else {
				throw("Cannot set params!")
		}
		
	}
}

module.exports = Node ;
