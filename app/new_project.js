var async 		= require("async");
var path 		= require("path");

var db 			= require('./db.js');
const mongoist = require('mongoist');


try {
	global.config 		= require("../config/config.js");
	global.config.file = "config.js (your local settings)";
} catch(e) {
	console.log("config.js not found or is malformed!");
	global.config 		= require("../config/config.js.example");
	global.config.file = "config.js.example (default settings)";
}

let dataPath = path.join(global.config.dataPath, "glampipe-data");
let projectsPath = path.join(dataPath, "projects");


exports.createRest = function(req, res) {
	
	
	var title = req.body.title;
	exports.create(title)
	.then(function(result) {
		if(res) res(result);
	})
	.catch(function(e){console.log(e)})
	

	
	
	
}

exports.create = async function(title) {
	
	console.log("PROJECT: creating project", title);
	var title_dir = cleanDirName(title);
	if(!title_dir) return Promise.reject("Empty project name!")
	
	try {
		// update project count and create project. Project count is *permanent* counter
		var incr = await db.collection('mp_settings').update({}, {$inc: { project_count: 1} });
		var meta = await db.collection('mp_settings').findOne({});
		
		var prefix = title_dir.substring(0,60).toLowerCase(); // limit 60 chars
		prefix = prefix.replace(/ /g,"_");
		prefix = "p" + meta.project_count + "_" + prefix;
		title_dir = title_dir + "_p" + meta.project_count;
		
		var project = {
			"title": title,
			"dir": title_dir,
			"prefix":  prefix,
			"nodes": [],
			"collection_count": 0,
			"node_count":0,
			"schemas": [],
			"owner": [] 
		};
		
		var result = await db.collection('mp_projects').insert(project);
		
		// create project directories
		var projectPath = path.join(projectsPath, title_dir)
		await createProjectDir(projectPath);
		await createProjectSubDirs(projectPath);
		
		return Promise.resolve(result)

	} catch(e) {
		console.log(e);
	}
}





exports.remove = async function (doc_id) {
	
	var project = await db.collection('mp_projects').findOne({_id: mongoist.ObjectId(doc_id)});
	if(!project) {
		console.log("Project " + doc_id + " not found")
		return;
	}
			
	console.log("PROJECT: deleting project", project.title);
	
	try {
	
		// if project has collections then remove those first
		if(project.collections) {
			for(var i=0; i < project.collections.length; i++) {
				console.log("PROJECT: deleting collection", project.collections[i]);
				await db.collection(project.collections[i]).drop();
			}
		}

		await db.collection('mp_projects').remove({_id: mongoist.ObjectId(doc_id)});
				
		// remove project directory
		var rmrf = require("rmrf");	
		var project_path = path.join(projectsPath, project.dir);
		if(project_path && project_path.includes(global.config.dataPath)) {
			console.log("PROJECT: removing " + project_path);
			await rmrf(project_path);
			console.log("PROJECT: " + project_path + " dir deleted!");
		} 
		return Promise.resolve()
	} catch(e) {
		console.log("PROJECT: could not delete directory!" + project_path);
		return Promise.reject();
	}
}





//*******************************
/* INTERNAL FUNCTIONS */
//*******************************

function cleanDirName(dir, project_count) {
	var clean_dir = dir.toLowerCase();
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


function createProjectSubDirs(projectPath) {
	var dirs = ["source", "process", "export", "view"]; // these dirs are created for every project	
	for(var i = 0; i < dirs.length; i++) {
		createProjectDir(path.join(projectPath, dirs[i]));
	}
}
