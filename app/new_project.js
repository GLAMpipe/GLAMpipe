var async 		= require('async');
var path 		= require('path');
var debug 		= require('debug')('GLAMpipe');
var error 		= require('debug')('ERROR');

var Collection 	= require('./new_collection.js');
var Node 		= require('./new_node.js');
const GP 		= require("../config/const.js");
const mongoist  = require('mongoist');





// create project
exports.create = async function(title) {

	debug("creating project", title);
	var title_dir = cleanDirName(title);
	if(!title_dir) return Promise.reject("Empty project name!")
	
	try {
		// update project count and create project. Project count is *permanent* counter
		var incr = await global.db.collection('gp_settings').update({}, {$inc: { project_count: 1} });
		var meta = await global.db.collection('gp_settings').findOne({});
		
		var dir = title_dir.substring(0,60).toLowerCase(); // limit 60 chars
		dir = dir.replace(/ /g,"_");
		dir = "p" + meta.project_count + "_" + dir;
		
		var project = {
			"title": title,
			"dir": dir,
			"collection_count": 0,
			"node_count":0,
			"schemas": [],
			"owner": [] 
		};
		
		var result = await global.db.collection('gp_projects').insert(project);
		
		// create project directories
		var projectPath = path.join(global.config.projectsPath, dir)
		await createProjectDir(projectPath);
		
		return result;

	} catch(e) {
		console.log(e)
		error(e);
	}
}




exports.remove = async function (doc_id) {

	debug("deleting project ", doc_id);

	var project = await global.db.collection('gp_projects').findOne({_id: mongoist.ObjectId(doc_id)});
	if(!project) {
		error("Project " + doc_id + " not found")
		throw("Project not found!")
	}

	// if project has collections then remove those first
	if(project.collections) {
		for(var i=0; i < project.collections.length; i++) {
			debug("deleting collection", project.collections[i]);
			try {
				await global.db.collection(project.collections[i]).drop();
			} catch(e) {
				error(e)
			}
		}
	}

	// remove project directory
	try {		
		await deleteProjectDir(project);
	} catch(e) {
		error("could not delete project directory!" + project.dir);
		error(e);
		throw("Could not delete project directory")
	}

	try {
		await global.db.collection('gp_projects').remove({_id: mongoist.ObjectId(doc_id)});
	} catch(e) {
		error(e)
		throw("Could not delete project " + doc_id)
	}
}


exports.getProjects = async function() {

	return await global.db.collection('gp_projects').findAsCursor({}, {
		'title': 1, 
		'collections': 1, 
		'nodes.nodeid': 1,
		'nodes.params': 1,
		'nodes.type': 1,
		'nodes.title': 1,
		'owner': 1
	  }).sort({'_id': -1}).toArray();

/*
     { $match: {
		_id: mongoist.ObjectId(doc_id)
		}
	},
	{	$lookup:
        {
           from: "gp_nodes",
           localField: "_id",
           foreignField: "project",
           as: "nodes"
        }
    }
 * */
}


exports.getProject = async function(project_id) {

	try {
		var p = await global.db.collection('gp_projects').findOne({_id: mongoist.ObjectId(project_id)});
		var nodes = await global.db.collection('gp_nodes').find({project: project_id});
		p.nodes = nodes;
		return p;
	} catch(e) {
		throw("Could not load project "+ doc_id)
	}



}

exports.getProjectByCollection = async function(collection_name) {

	return global.db.collection('gp_projects').findOne({collections: {$in: [collection_name]}});

}

exports.addCollection = async function(collection_name) {

	await global.db.createCollection(collection_name);

}


//*******************************
/* INTERNAL FUNCTIONS */
//*******************************



function cleanDirName(title, project_count) {
	var clean_dir = title.toLowerCase();
	clean_dir = clean_dir.replace(/[^a-z0-9- ]/g,"");
	clean_dir = clean_dir.replace(/[ ]/g,"_");	
	return clean_dir;
}



function createProjectDir(dir) {
	var fs = require("fs");
	return new Promise(function (resolve, reject) {
		fs.mkdir(dir, function(err) {
			if(err) {
				if(err.code === "EEXIST") reject()
				else reject(err)
			} 
			else resolve()
		})
	})	
}



async function deleteProjectDir(project) {

	var rmrf = require("rmrf");	
	let project_path = path.join(global.config.dataPath, "projects", project.dir);
	if(project_path && project_path.includes(global.config.dataPath)) {
		debug("removing " + project_path);
		await rmrf(project_path);
		debug(project_path + " deleted!");
	}
}


function createProjectSubDirs(projectPath) {
	var dirs = ["source", "process", "export", "view"]; // these dirs are created for every project	
	for(var i = 0; i < dirs.length; i++) {
		createProjectDir(path.join(projectPath, dirs[i]));
	}
}
