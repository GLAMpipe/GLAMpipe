var mongojs 	= require('mongojs');
var async 		= require("async");
var path 		= require("path");
var mongoquery 	= require("../app/mongo-query.js");
var runswitch 	= require("../app/run-switch.js");


exports.createProject = function (req, res) {
	
	var title = req.body.title
	var dirs = ["export", "source", "view", "process", "meta"]; // these dirs are created for every project
	console.log("PROJECT: creating project", title);
	var title_dir = title.toLowerCase();
	title_dir = title_dir.replace(/[^a-z0-9- ]/g,"");
	title_dir = title_dir.replace(/[ ]/g,"_");
	// create projects/project_name directory 
	var projectPath = path.join(global.config.projectsPath, title_dir); 
	fs.mkdir(projectPath, function(err) {
		var error_msg = "error in project directory creation!";
		if(err) {
			if(err.code === "EEXIST") 
				error_msg = "Project directory exists! Please use other name for the project or delete project directory: " + projectPath;
			else
				error_msg = err;
			
			console.log("ERROR:", error_msg);
			res.json({"error": error_msg});
			return;
		}
		// create node output directories (blocking)
		for(var i = 0; i < dirs.length; i++) {
			fs.mkdirSync(path.join(projectPath, dirs[i]));
		} 
		// update project count and create project. Project count is *permanent* counter
		mongoquery.update("mp_settings",{}, {$inc: { project_count: 1} }, function() {
			mongoquery.findOne({}, "mp_settings", function(err, meta) {
				var collectionName = title_dir.substring(0,60).toLowerCase(); // limit 30 chars
				collectionName = collectionName.replace(/ /g,"_");
				var project = {
					"title": title,
					"dir": title_dir,
					"prefix": "p" + meta.project_count + "_" + collectionName ,
					"collection_count": 0,
					"node_count":0,
					"schemas": [],
					"owner": "" 
				};
				
				// mark the owner
				if(req.user && req.user.local && req.user.local.email)
					project.owner = req.user.local.email;
				
				mongoquery.insertProject (project, function(err, data) {
					console.log("project \"" + title + "\" created!");
					res.json({"status": "project created", "project": data});
				});
			});
		});
	});
}




exports.deleteProject = function (doc_id, res) {
	
	mongoquery.findOneById(doc_id, "mp_projects", function(project) {
		if(!project)
			return res.json({});
			
		console.log("PROJECT: deleting project", project.title);
		// if project has collections then remove those first
		require("async").eachSeries(project.collections, function iterator (collection, next) {
			console.log("PROJECT: deleting collection " + collection)
			mongoquery.dropCollection(collection, next);
			
			// then remove project document itself
		}, function done () {
			mongoquery.remove(doc_id, "mp_projects", function(err, data) {
				// remove project directory
				var rimraf = require("rimraf");	
				var project_path = path.join(global.config.projectsPath, project.dir);
				if(project_path && project_path.includes(config.dataPath)) {
					console.log("PROJECT: removing " + project_path);
					rimraf(project.dir, function() {
						console.log("PROJECT: " + project.title + " deleted!");
						res.json(data);						
					});
				} else {
					console.log("PROJECT: " + project.title + " deleted!");
					res.json(data);
				}

			});
		});
	});
}

exports.getProjectTitles = function  (res) {
	mongoquery.findFields({}, {title:true}, {title:1}, "mp_projects", function(err, data) { 
		if (!err)
			res.json(data) ;
		else 
			res.json(JSON.parse(err));
	});
}


exports.getProjects = function  (res) {
	mongoquery.getAllProjects(function(data) { res.json(data) });
}


exports.getProject = function (doc_id, res) {
	mongoquery.findOneById(doc_id, "mp_projects", function(data) { res.json(data) });
}




function finish (next) {
	next();
}


exports.isAuthenticated = function (req, cb) {
    if(req.user && req.user.local && req.user.local.email && req.user.local.email) {
        var id = req.params.project;
        //  we are authenticating for project operation (add/remove node)
        if(id) {
            mongoquery.findOneById(id, "mp_projects", function(data) {
                console.log("PROJECT: owner = " + data.owner);
                if(req.user.local.email == data.owner)
                    cb(true);
                else
                    cb(false);
            });
        // we are authenticating for node run
        } else {
            var nodeid = mongojs.ObjectId(req.params.id);
            mongoquery.findOne({nodes:{$elemMatch:{_id:nodeid}}}, "mp_projects", function(err, project) {
                if(!err) {
                    console.log("OWNER " +project.owner);
                    if(project && project.owner == req.user.local.email )
                        cb(true);
                    else
                        cb(false);
                } else {
                    cb(false);
                }
            })
        }
    } else {
        cb(false); // we do not have user
    }
}

exports.run = function (projectId, gp, cb) {
		
	console.log("QUE: run all project nodes");
	
	var listener = function () {
		var self = this;
		this.next = null;
		this.setNext = function(next) {this.next = next;}
		this.finish = function (data) {
			console.log("TASK finished!")
			self.next();
		}
		this.progress = function (data) {
			console.log("SOCKET:", data);
		}
	}
	
	var l = new listener();
	// we listen our own websocket messages so that we 
	// TODO: this might be problematic with multiple users
	gp.wsClient.on('progress', l.progress);
	gp.wsClient.on('finish', l.finish);
	

		
	mongoquery.findOneById(projectId, "mp_projects", function(data) {
		console.log("PROJECT: running project", data.title);
		var nodes = sortNodes(data);
		console.log("NODE COUNT:", nodes.length);
		// run node once per record
		require("async").eachSeries(nodes, function iterator (node, next) {
			console.log("RUNNING node", node.nodeid);
			l.setNext(next);
			
			runswitch.runNode(node, gp.io);

		}, function done () {
			console.log("QUE: project executed")
			gp.wsClient.off('finish', l.finish);
			gp.wsClient.off('progress', l.progress);
		});
		
		//console.log(nodes);

		// if nodes are not executed before, they are run in creation order
		// if node are executed before, they are run in previous execution order
		
		cb({"status": "project run started", "project": data});
	});
}

function startQue () {
	
}

// group nodes per collection
function sortNodes (project) {

	var nodes = [];

	// we run nodes per collection
	project.collections.forEach(function(collection, i) {
		
		// find nodes for current collection 
		project.nodes.forEach(function(node, j) {
			if(node.collection == collection && node.type !== "collection") {
				nodes.push(node);
			}
		})
	})
	return nodes;
}
