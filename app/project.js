var mongojs 	= require('mongojs');
var async 		= require("async");
var path 		= require("path");
var mongoquery 	= require("../app/mongo-query.js");
var runswitch 	= require("../app/run-switch.js");


exports.createProject = function (req, res) {
	
	var title = req.body.title;
	var dirs = ["source", "process", "export", "view"]; // these dirs are created for every project
	console.log("PROJECT: creating project", title);
	var title_dir = title.toLowerCase();
	title_dir = title_dir.replace(/[^a-z0-9- ]/g,"");
	title_dir = title_dir.replace(/[ ]/g,"_");
	
	if(!title_dir)
		return res.json({"error": "Invalid project name"});
				
	// update project count and create project. Project count is *permanent* counter
	mongoquery.update("mp_settings",{}, {$inc: { project_count: 1} }, function() {
		mongoquery.findOne({}, "mp_settings", function(err, meta) {
			var prefix = title_dir.substring(0,60).toLowerCase(); // limit 60 chars
			prefix = prefix.replace(/ /g,"_");
			prefix = "p" + meta.project_count + "_" + prefix;
			title_dir = title_dir + "_p" + meta.project_count;
			
			var project = {
				"title": title,
				"dir": title_dir,
				"prefix":  prefix,
				"collection_count": 0,
				"node_count":0,
				"schemas": [],
				"owner": [] 
			};
			
			// mark the owner
			if(global.config.authentication === "local") {
				if(req.user && req.user.local && req.user.local.email)
					project.owner.push(req.user.local.email);
			} else if(global.config.authentication === "shibboleth") {
				project.owner.push(req.headers[global.config.shibbolethHeaderId]);
			}
			
			mongoquery.insertProject (project, function(err, data) {
				
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
					} else {
						// create node output directories (blocking)
						for(var i = 0; i < dirs.length; i++) {
							fs.mkdirSync(path.join(projectPath, dirs[i]));
						}
						 
						console.log("project \"" + title + "\" created!");
						res.json({"status": "project created", "project": data});
					}
				});
			});
		});
	});
}


exports.copyProject = function(req, res) {
	
	var nodeCreator 	= require("../app/node.js");
	var project_id = req.params.id;
	var project_title =  req.body.title;
	var original_project = null;
	var new_project = null;

	var io = {
		emit: function() {}
	}

	// a callback that is called when first collection is created for new project
	var node_creation_cb = {
		json: function(node_res) {
			next()
		}
	}
	// a callback that is called when first collection is created for new project
	var col_creation_cb = {
		json: function(data) {

			// currently we copy only first collection and its nodes
			if(original_project.collections[0] && original_project.collections[0][0]) {
				
				// we must create new ObjectIDs for nodes and we must change node directory and collection
				original_project.nodes.forEach(function(node, index, arr) {
					
					// we must copy only nodes that are linked to first collection of the copied project
					if(node.collection === original_project.collections[0][0]) {
						arr[index]._id = mongojs.ObjectId();
						arr[index].collection = data.collection;
					} else {
						arr[index].reject = true;
					}
					// do not copy collection nodes
					if(node.type === "collection")
						arr[index].reject = true;
				})
				
				// insert nodes one by one to the new project
				require("async").eachSeries(original_project.nodes, function iterator (node, next) {
					console.log(node);
					if(node.reject)
						return next(); 
						
					if(!node.params)
						node.params = {};
					// create collection
					var req_node = {
						query: {},
						body: {
							params: node.params,
							settings: node.settings,
							collection: data.collection
						},
						params:{
							project: new_project.project._id,
							nodeid: node.nodeid
						}
					}
					
					nodeCreator.createNode(req_node, {json:function() {next()}}, io);
					
				}, function done () {
					res.json(data);
				});
			}
		}
	}
	
	// callback that is called when new project is created
	var proj_creation_cb = {json:function(data){
			console.log(data)
			new_project = data;
			// copy collections and nodes from original project to the new project
			mongoquery.findOneById(project_id, "mp_projects", function(project) {
				if(!project)
					return res.json({});

				original_project = project;
				
				// create collection
				var col_req = {
					body: {
						params: {title: "collection"}
					},
					params:{
						project: data.project._id,
						nodeid: "collection_basic"
					}
				}
				// user
				if(req.user && req.user.local && req.user.local.email)
					col_req.user = req.user;
					
				req.params.id, req.body.title
				
				nodeCreator.createCollectionNode(col_req, col_creation_cb, {});
			})
		}
	}
	
	var proj_req = {
		body: {
			title: req.body.title
		}
	}
	// user
	if(req.user && req.user.local && req.user.local.email)
		proj_req.user = req.user;
	
	// create new project with title
	exports.createProject(proj_req, proj_creation_cb);
	

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
				if(project_path && project_path.includes(global.config.dataPath)) {
					console.log("PROJECT: removing " + project_path);
					rimraf(project_path, function(err) {
						if(err) {
							console.log("PROJECT:  error! " + err.message);
							res.json({error: err.message})
						} else {
							console.log("PROJECT: " + project.title + " dir deleted!");
							res.json(data);						
						}
					});
				} else {
					console.log("PROJECT: could not delete directory!" + project_path);
					res.json(data);
				}

			});
		});
	});
}


exports.addOwner = function (project_id, new_owner, res) {

	if(!new_owner)
		return res.json({});
		
	mongoquery.findOneById(project_id, "mp_projects", function(project) {
		if(!project)
			return res.json({});
			
		mongoquery.update("mp_projects", {_id:mongojs.ObjectId(project_id)}, {$addToSet: { owner: new_owner} }, function(result) {
			res.json({})
		});
	});
}


exports.removeOwner = function (project_id, owner, res) {

	if(!owner)
		return res.json({});
		
	mongoquery.findOneById(project_id, "mp_projects", function(project) {
		if(!project)
			return res.json({});
			
		mongoquery.update("mp_projects", {_id:mongojs.ObjectId(project_id)}, {$pull: { owner: owner} }, function(result) {
			res.json({})
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

exports.getProjectAsText = function (doc_id, res) {
	mongoquery.findOneById(doc_id, "mp_projects", function(data) { 
		var text = "GLAMPIPE PROJECT DESCRIPTION\n";
		text += "\n******************************************";
		text += "\n\nPROJECT: " + data.title;
		text += "\n\n******************************************";
		
		
		if(data.collections) {
			data.collections.forEach(function(collection) {
				
				text += "\n\nNODES OF COLLECTION: " + collection;
				
				if(data.nodes) {
					// sources
					text += "\n\n** SOURCES **";
					data.nodes.forEach(function(node) {
						if(node.type === "source" && node.params.collection === collection[0]) {

							if(node.settings && node.settings.node_description) {
								text += "\n\n  ---------------------------------------";
								text += "\n  " + node.settings.node_description;
								text += "\n   SETTINGS:\n " + JSON.stringify(node.settings, null, " ");
							} else {
								text += "\n\n  ---------------------------------------";
								text += "\n  " + node.title ;
								text += "\n   SETTINGS:\n " + JSON.stringify(node.settings, null, " ");
							}
						}
					})
					
					// other nodes
					text += "\n\n** OPERATIONS **";
					data.nodes.forEach(function(node) {
						if(node.type !== "collection" && node.type !== "source" && node.type !== "export" && node.params.collection === collection[0]) {

							if(node.settings && node.settings.node_description) {
								text += "\n  --------------------------------------";
								text += "\n  " + node.settings.node_description;
								text += "\n   - " + node.title;
							} else {
								text += "\n  ---------------------------------------";
								text += "\n  " + node.title ;
							}
						}
					})
					// exports
					text += "\n\n** EXPORTS **";
					data.nodes.forEach(function(node) {
						if(node.type === "export" && node.params.collection === collection[0]) {

							if(node.settings && node.settings.node_description) {
								text += "\n\n  ---------------------------------------";
								text += "\n  " + node.settings.node_description;
								text += "\n   - " + node.title;
							} else {
								text += "\n\n  ---------------------------------------";
								text += "\n  " + node.title ;
							}
						}
					})
				}
				
			})
		}
		

		res.set("Content-Type","text/plain");
		res.send(text) ;
		//res.json(JSON.stringify(data, null, "\n")) 
	});
}



function finish (next) {
	next();
}

exports.isPublic = function(req, res, next) {

	// GET request are open if public install
	if( global.config.public)
		next();
	else
		res.status(401).json({error: "not public installation"});

}


// check if user can add/remove nodes
exports.authProject = function(req, res, next) {
	var user = getUser(req)
	var project_uuid = req.params.project;
	
	// check if user is the owner of the project
	if(project_uuid) {
		mongoquery.findOneById(project_uuid, "mp_projects", function(project) {
			if(user && project.owner.includes(user))
				next();
			else
				res.status(401).json({error:"You have no rights to add nodes to this project!"});
		});
	} else {
		res.status(404).json({error:"Project not found!"});
	}
}


// check if user can run node
exports.authNode = function(req, res, next) {
	
	// first check if route should be open
	var pass = false;
	global.config.IP_passes.some(function(IP_pass) {
		if(req.path.includes(IP_pass.path) && req.method === IP_pass.method && (req.ip === IP_pass.ip || IP_pass.ip === "*")) {
			pass = true;
			console.log("INFO: " + req.method + " allowed by IP_pass: " + IP_pass.label)
		}
	})
	if(pass)
		return next();

	var user = getUser(req)
	var node_uuid = req.params.id;
	
	try {
		node_uuid = mongojs.ObjectId(req.params.id);
	} catch(e) {
		res.status(404).json({error:"Node not found!"});
	}

	mongoquery.findOne({nodes:{$elemMatch:{_id:node_uuid}}}, "mp_projects", function(err, project) {
		if(!err) {
			if(project && user && project.owner.includes(user) )
				next()
			else
				res.status(401).json({error:"Node run not authenticated!"});
		} else {
			res.status(401).json({error:"Node run not authenticated!"});
		}
	})
}




exports.isAuthenticated = function (req, cb) {
	
	if(req.method === "GET" && global.config.authentication === "local")
		return cb(true);

	
	if(global.config.authentication === "local") {
		if(req.user && req.user.local && req.user.local.email && req.user.local.email) {
			var id = req.params.project;
			//  we are authenticating for project operation (add/remove node)
			if(id) {
				mongoquery.findOneById(id, "mp_projects", function(project) {
					if(project.owner.includes(req.user.local.email))
						cb(true);
					else
						cb(false);
				});
			// we are authenticating for node run (separate since there is no project id on node run URL)
			} else {
				var nodeid = mongojs.ObjectId(req.params.id);
				mongoquery.findOne({nodes:{$elemMatch:{_id:nodeid}}}, "mp_projects", function(err, project) {
					if(!err) {
						if(project && project.owner.includes(req.user.local.email) )
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
	} else if (global.config.authentication === "shibboleth") {
		console.log(req.headers[global.config.shibbolethHeaderId])
		if(req.headers[global.config.shibbolethHeaderId]) {
			var id = req.params.project;
			//  we are authenticating for project operation (add/remove node)
			if(id) {
				mongoquery.findOneById(id, "mp_projects", function(project) {
					//console.log("PROJECT: owner = " + data.owner);
					if(project.owner.includes(req.headers[global.config.shibbolethHeaderId]))
						cb(true);
					else
						cb(false);
				});
			// we are authenticating for node run (separate since there is no project id on node run URL)
			} else {
				var nodeid = mongojs.ObjectId(req.params.id);
				mongoquery.findOne({nodes:{$elemMatch:{_id:nodeid}}}, "mp_projects", function(err, project) {
					if(!err) {
						if(project && project.owner.includes(req.headers[global.config.shibbolethHeaderId]))
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
}



//exports.run = function (projectId, gp, cb) {
		
	//console.log("QUE: run all project nodes");
	
	//var listener = function () {
		//var self = this;
		//this.next = null;
		//this.setNext = function(next) {this.next = next;}
		//this.finish = function (data) {
			//console.log("TASK finished!")
			//self.next();
		//}
		//this.progress = function (data) {
			//console.log("SOCKET:", data);
		//}
	//}
	
	//var l = new listener();
	//// we listen our own websocket messages so that we 
	//// TODO: this might be problematic with multiple users
	//gp.wsClient.on('progress', l.progress);
	//gp.wsClient.on('finish', l.finish);
	

		
	//mongoquery.findOneById(projectId, "mp_projects", function(data) {
		//console.log("PROJECT: running project", data.title);
		//var nodes = sortNodes(data);
		//console.log("NODE COUNT:", nodes.length);
		//// run node once per record
		//require("async").eachSeries(nodes, function iterator (node, next) {
			//console.log("RUNNING node", node.nodeid);
			//l.setNext(next);
			
			//runswitch.runNode(node, gp.io);

		//}, function done () {
			//console.log("QUE: project executed")
			//gp.wsClient.off('finish', l.finish);
			//gp.wsClient.off('progress', l.progress);
		//});
		
		////console.log(nodes);

		//// if nodes are not executed before, they are run in creation order
		//// if node are executed before, they are run in previous execution order
		
		//cb({"status": "project run started", "project": data});
	//});
//}

//function startQue () {
	
//}

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

function isOwner(owner, user) {
	return owner === user;
}

function getUser(req) {
	if(global.config.authentication === "shibboleth" && req.headers[global.config.shibbolethHeaderId]) 
		return req.headers[global.config.shibbolethHeaderId];
	else if(global.config.authentication === "local") {
		if(req.user && req.user.local && req.user.local.email && req.user.local.email) {
			return req.user.local.email;
		}
	}
	return "";
}
