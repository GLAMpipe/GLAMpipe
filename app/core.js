var mongojs 	= require('mongojs');
var async 		= require("async");
var colors 		= require('ansicolors');
var path 		= require("path");
var flatten 	= require("flat");
const vm 		= require('vm');
var mongoquery 	= require("../app/mongo-query.js");
const MP 		= require("../config/const.js");
var exports 	= module.exports = {};


var positionOffset = 60;


exports.createPipe = function (req) {
	console.log(req.body);
	return 'Pipe created';
}


/**
 * Create glampipe collection on start up
 * - "glampipe" is only collection that must exist
 * - makes sure that "project_count" exists
 */
exports.initDB = function (callback) {
	mongoquery.findOne({},"mp_settings", function(err, data) { 
		if(err) {
			console.log("INITDB failed!");
			callback(err);
		} else {
			if(data) {
				console.log("DB: mp_settings exists");
				callback();
			} else {
				console.log("DB: creating project counter");
				mongoquery.insert("mp_settings", {"project_count":0, "data_path":""}, function(error, result) {
					if(error) {
						console.log("ERROR: could not create project counter!");
						callback(result.error);
					}
					else 
						callback();
				});
			}
		}
	});
}

exports.createProjectsDir = function (dataPath, callback) {
	fs = require('fs');
	
	// create "projects" directory
	fs.mkdir(path.join(dataPath, "projects"), function(err) {
		if(err) {
			if (err.code === "ENOENT") {
				return callback(err, "dataPath directory does not exist!");
				
			} else if(err.code === "EEXIST") {
				return callback();
				
			} else
				return callback(err, err.message);
				
		}
		console.log("INIT: project directory created");
		callback();
	});
			

}


/**
 * load stock nodes
 * - reads .json files from "nodes" directory
 * - combines with descriptions from "node_type_descriptions.json"
 * - inserts nodes to "mp_nodes" collection
 */

exports.initNodes = function (nodePath, io, callback) {
		
	mongoquery.drop("mp_nodes", function() {

		fs = require('fs');
		// read first node type descriptions
		fs.readFile(path.join(nodePath, "nodes", "config", "node_type_descriptions.json"), 'utf8', function (err, data) {
			if(err) {
				console.log("NOTICE: node type descriptions not found from " + nodePath);
				desc = {};
			} else 
				
				var desc = JSON.parse(data);
				console.log("INIT: Loading nodes from " + path.join(nodePath, "nodes/") );
				exports.readNodes(io, path.join(nodePath, "nodes/"), desc, function (error) {
					if(error){
						// otherwise default nodes (included in the image)
						console.log("ERROR: Loading nodes failed!");
						callback(error);

					} else
						callback(null);     
				});        
		});
	});
}


exports.downloadNodes = function (io, cb) {

	var dataPath = global.config.dataPath;
	var download = { 
			url:"https://github.com/artturimatias/metapipe-nodes/archive/master.zip",
			filename:"master.zip"
	};
				
	var node = {dir:dataPath};
	
	// download nodes
	console.log("DOWNLOADING: nodes from github");
	io.sockets.emit("progress", "DOWNLOADING: nodes from github");

	var downloader = require("../app/node_runners/download-file.js");
	downloader.downloadAndSave(node, download, function (err) {
		if(err) {
			console.log(err);
			io.sockets.emit("error", err);
			cb(err);
			
		} else {
			const Zip = require("adm-zip");
			var zip = new Zip(path.join(dataPath, "master.zip"));
			console.log("EXTRACTING: master.zip to " + dataPath + "/nodes/");
			zip.extractEntryTo("metapipe-nodes-master/nodes/", dataPath + "/nodes/", false, true);
			io.sockets.emit("progress", "DOWNLOADING: done!");
			cb();
		}
	})
}


exports.sendErrorPage = function (res, error) {
	fs = require('fs');
	fs.readFile(path.join(__dirname, "views", "setup.html"), 'utf-8', function(err, content) {
		if (err) {
			console.log(err);
			res.send(err);
		} else {
			// write error inside a script tag
			if(error) {
				content = content.replace("[[initerror]]", "<script>var error = " + JSON.stringify(error) + "</script>");
			} else {
				content = content.replace("[[initerror]]", "<script>var error = {status:'ok',datapath:'"+global.config.dataPath+"'}</script>");
			}
			res.send(content);
		}
	});
}


exports.setDataPath = function (params, glampipe, res) {
	var dataPath = params.datapath;
	mongoquery.update("mp_settings",{}, {$set: {data_path: dataPath}}, function(error) {
		if(error) {
			console.log(error);
			glampipe.io.sockets.emit("error", "could not save datapath");
			res.json({"error":"could not save datapath"});
		} else {
			glampipe.initError = {status: "ok"};
			global.config.dataPath = dataPath;
			global.config.projectsPath = path.join(dataPath, "projects");
			console.log("datapath set to:", dataPath );
			glampipe.io.sockets.emit("progress", "datapath set to: " + dataPath);
			res.json({"status": "ok","datapath": dataPath});
		}
	})
};


exports.createProject = function (title, res) {
	
	var dirs = ["download", "export", "source"];
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
		// update project count and create project
		mongoquery.update("mp_settings",{}, {$inc: { project_count: 1} }, function() {
			mongoquery.findOne({}, "mp_settings", function(err, meta) {
				var collectionName = title_dir.substring(0,30).toLowerCase(); // limit 30 chars
				collectionName = collectionName.replace(/ /g,"_");
				var project = {
					"title": title,
					"dir": title_dir,
					"prefix": "p" + meta.project_count + "_" + collectionName ,
					"collection_count": 0,
					"node_count":0,
					"schemas": []
				};
				mongoquery.insertProject (project, function(err, data) {
					console.log("project \"" + title + "\" created!");
					res.json({"status": "project created", "project": data});
				});
			});
		});
	});
}


exports.runProject = function (req, gp, res) {
	var projectId = req.params.id;

	var project	= require("../app/project.js");
	project.run(req.params.id, gp, function(data) {
		res.json(data);
	});


}


exports.deleteProject = function (doc_id, res) {
	
	mongoquery.findOneById(doc_id, "mp_projects", function(data) {
		console.log("PROJECT: deleting project", data.title);
		// if project has collections then remove those first
		
		// then remove project document itself
		mongoquery.remove(doc_id, "mp_projects", function(err, data) {
			res.json(data);
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


exports.getNodes = function (res) {
	//mongoquery.find({}, "nodes", function(data) { res.json(data) });
	mongoquery.nodes( function(data) { res.json(data) });
}


exports.getProjectNodes = function (project, res) {
	mongoquery.findOneById(project, "mp_projects", function(data) { res.json(data) });
}

exports.getNodeFromDir = function (node_id, res) {
	fs = require('fs')
	var nodeDir = path.join(global.config.dataPath, "nodes", node_id);
	
	readNodeDirectory (nodeDir, null, function callback(node) {
		res.json(node); 
	})
}


exports.getNodeFromFile = function (node_id, res) {
	fs = require('fs')
	var userNode = path.join(global.config.dataPath, "mynodes", node_id + ".json");
	var stockNode = path.join(global.config.dataPath, "nodes", node_id + ".json");
	
	// try first stock nodes and then user nodes
	fs.readFile(stockNode, 'utf8', function (err, data) {
		if(err) {
			fs.readFile(userNode, 'utf8', function (err, data) {
				if(err) {
					console.log("ERROR: node not found!");
					res.json({"error": "node " + node_id + "not found!"});
				} else {
					res.json(JSON.parse(data));    
				}
			})
		} else {
			res.json(JSON.parse(data));
		}
	});
}



/**
 * run project node based on node type
 * - this is THE MAIN SWITCH of GLAMpipe
 */ 
exports.runNode = function (req, io, res) {

	console.log('Running node:', req.params.id);
	io.sockets.emit("news", "NODE: running node " + req.params.id);

	mongoquery.findOne({"nodes._id":mongojs.ObjectId(req.params.id)}, "mp_projects", function(err, project) {
		if(!project) {
			console.log("node not found");
			io.sockets.emit("error", "node not found");
			return;
		}
		var index = indexByKeyValue(project.nodes, "_id", req.params.id);
		var node = project.nodes[index];
		node.settings = req.body;
		node.project = project._id;
		node.project_dir = project.dir;

		// save node settings TODO: set callback
		mongoquery.editProjectNode(node._id, {"settings":node.settings}, function() {

			console.log("\n>>>>>>>>>>>>>>>>>>>>>> NODE >>>>>>>>>>>>>>>>>>>>>>>>");
			console.log("title: " + node.title);
			console.log("type: ", node.type);
			console.log("params:");
			console.log(node.params);
			console.log("settings:");
			console.log(node.settings);
			console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n");
			
			if(res)
				node.res = res;
			
			try {
				require("../app/run-switch.js").runNode(node, io);
			} catch (e) {
				console.log(e.message);
				io.sockets.emit("error", e.message);
			}
		})

	})
}








exports.uploadFile = function (req, res ) {
	
	console.log("req.file:", req.file);
	
	switch (req.file.mimetype) {
		case "text/xml":
			console.log("File type: XML");
			return res.json({"error":"XML import not implemented yet!"});
		break;
		
		case "application/json":
			console.log("File type: JSON");
			return res.json({"error":"JSON import not implemented yet!"});
		break;
		
		case "text/tab-separated-values":
			console.log("File type: tab separated values");
			return res.json({
				"status": "ok",
				filename:req.file.filename,
				mimetype:req.file.mimetype,
				title: req.body.title,
				nodeid: req.body.nodeid,
				project: req.body.project,
				description: req.body.description
			})
		break;
		
		case "text/comma-separated-values":
		case "text/csv":
			console.log("File type: comma separated values");
			return res.json({
				"status": "ok",
				filename:req.file.filename,
				mimetype:req.file.mimetype,
				title: req.body.title,
				nodeid: req.body.nodeid,
				project: req.body.project,
				description: req.body.description
			})
		break;

		case "text/plain":
			console.log("File type: plain text");
			return res.json({
				"status": "ok",
				filename:req.file.filename,
				mimetype:req.file.mimetype,
				title: req.body.title,
				nodeid: req.body.nodeid,
				project: req.body.project,
				description: req.body.description
			})
		break;
		
		default:
			console.log("File type: unidentified!");
			return res.json({"error":"File type unidentified! " + req.file.mimetype});
	}
}



/**
 * updates nodes visible fields
*/ 
exports.setVisibleFields = function (nodeid, params, res) {

	mongoquery.editProjectNode(nodeid, {"visible_keys": params.keys},
		function() {
			res.json({"status":"node updated"});
		}
	);
}

exports.createNode = function (req, res, io) {
	
	if(req.query.type && req.query.type === "collection") {
		exports.createCollectionNode(req, res, io);
	} else {

		mongoquery.findOneById(req.params.project, "mp_projects", function(project) {
			req.node_count = project.node_count;
			mongoquery.update("mp_projects",{_id:mongojs.ObjectId(req.params.project)}, {$inc: { node_count: 1} }, function() {
				initNode(req, res, io, project);
			});
		});
		
	}
}



exports.createCollectionNode = function (req, res, io) {

	mongoquery.findOneById(req.params.project, "mp_projects", function(data) {
		
		// make sure that params exist even if they were not given
		if(req.body.params == null)
			req.body.params = {};
			
		// cleanup name
		var collectionName = "";
		if(req.body.params.title)
			collectionName = req.body.params.title.replace(/[^a-z0-9- ]/g,"").toLowerCase();
		
		//						  project count
		var collection = data.prefix + "_c" + data.collection_count + "_" + collectionName;
		req.body.params.collection = collection;
		req.node_count = data.node_count;
		mongoquery.update("mp_projects",{_id:mongojs.ObjectId(req.params.project)}, {$inc: { collection_count: 1, node_count: 1}, $addToSet: {collections: [collection] } }, function() {
			mongoquery.createCollection(collection, function () {
				initCollectionNode(req, res, io);
			});
		})
	});
}


/**
 * Create default project node
 * - adds params defined by user to the stock node
 * - saves result to project record (under "nodes")
 */
 
function initNode (req, res, io, project) {

	console.log("New node id:", mongojs.ObjectId());
	console.log("nodeparams:", req.body.params);
	
	// callback for inserting node to db
	var insertNode = function (node, cb) {
		console.log("inserting");
		
		mongoquery.update("mp_projects",
			{_id:mongojs.ObjectId(node.project)},
			{$push:{nodes: node}},
			function(error) {
				cb(error);
		})
	}
	
	// copy node to project with its settings
	mongoquery.findOne({"nodeid":req.params.nodeid}, "mp_nodes", function(err, node) {
		if(node) {
			node.project = req.params.project
			node.collection = req.body.collection;
			node.number = req.node_count;
			node.dirsuffix = ""; // node can set this in "hello" script
			
			if(req.body.params)
				node.params = req.body.params;
			else
				node.params = {};
				
			if(node.params.out_field)
				node.out_field = node.params.out_field;

			// node creation can also include settings for running node 
			if(req.body.settings)
				node.settings = req.body.settings;


			// settings html is on client side and therefore it is not aware of node content
			// so we inject node.params to settings view so that client side script can acces parameters of node (urls and so on)
			if( node.views.settings) {
				node.views.settings = node.views.settings.replace("[[params]]", "var params = " + JSON.stringify(node.params) + ";\n");
			}

			node.params.collection = node.collection;
			
			// copy static data view to project node's view if defined
			if(typeof node.views.data_static !== "undefined")
				node.views.data = node.views.data_static;
			
			runNodeScript("hello", node, req, io);
			
			node._id = mongojs.ObjectId();
			
			// create output directory for nodes that do file output
			if(node.type == "download" || node.type == "export" || node.type == "source") {
				var fs = require("fs");
				var dir = path.join(global.config.projectsPath, project.dir, node.type, project.node_count + "_" + node.nodeid + node.dirsuffix);
				fs.mkdir(dir, function(err) {
					if(err) {
						console.log("ERROR:", err);
						io.sockets.emit("error", "Could not create node's output directory!");
						return res.json({"error":"Could not create node's output directory!"});
							
					} else {
						console.log("INIT: output directory created");
						node.dir = dir;
						insertNode(node, function(err) {
							if(err) {
								console.log(err);
								res.json({"error": err});
							} else {
								console.log("node created");
								res.json({
									status:'node created', 
									id:node._id, 
									node:node,
									collection:node.collection,
									nodeid: node.nodeid
								})
							}
						});
					}
				});

			// otherwise just insert node 
			} else {
				insertNode(node, function (err) {
					if(err) {
						console.log(err);
						res.json({"error": err});
					} else {
						console.log("node created");
						
						
						// interactive nodes are not run, so we
						// initialize empty field for all records
						if (node.init_fields) {
							var setter = {};
							for (var i = 0; i < node.init_fields.length; i++) {
								setter[node.init_fields[i]] = "";
							}
							mongoquery.update(node.collection,{}, {$set: setter }, function() {
								res.json({
									status:'node created', 
									id:node._id, 
									node: node,
									collection:node.collection, 
									nodeid: node.nodeid
								});
							})  
						} else {
							res.json({
								status:'node created', 
								id:node._id, 
								node: node, 
								collection:node.collection,
								nodeid: node.nodeid
							});
						} 
					}
				});
			}
			


		} else {
			console.log("ERROR: node not found");
		}
	});
}



function initCollectionNode (req, res, io) {
	
	// copy node to project with its settings
	mongoquery.findOne({"nodeid":req.params.nodeid}, "mp_nodes", function(err, node) {
		if(node) {
			node.input_node = "";
			node.project = req.params.project;
			if(req.body.params)
				node.params = req.body.params;
			else
				node.params = {};
				
			if(!node.params.title)
				node.params.title = "";
				
			node.collection = req.body.params.collection;
			node.number = req.node_count;
			
			runNodeScript("hello", node, req, io);
			
			node._id = mongojs.ObjectId();
			mongoquery.update("mp_projects",
				{_id:mongojs.ObjectId(node.project)},
				{$push:{nodes: node}},
				function(error) {
					if(error) {
						console.log(error);
						res.json({"error": error});
					} else {
						console.log("node created");
						res.json({
							"status": "node created", 
							"collection":node.collection, 
							"title": node.params.title,
							"nodeid": node.nodeid
							})
					}

			})
		} else {
			console.log("node " + req.nodeid + " not found!");
			res.json({"error": "node " + req.nodeid + " not found"})
		}
	});
}

/**
 * Delete project node
 * - removes node
 * - if collection node, then also removes collection
 * - if source node, then also removes node's data
 */
exports.deleteNode = function (req, res, io) {

	mongoquery.findOne({"_id":mongojs.ObjectId(req.params.project)}, "mp_projects", function(err, project) {
		if(project) {
			var index = indexByKeyValue(project.nodes, "_id", req.params.node);
			var node = project.nodes[index];
			// check that there is no nodes that depends on this node
			if(inputNode(node, project.nodes)) {
				return res.json({"error": "Can not remove node with child nodes!"});
			}

			// allow node to say bye
			//runNodeScript("bye", node, null, io);

			// check if we need to remove anything else
			async.series([

				// if node is collection node, then also remove its collection
				function(callback) {
					if(node.type == "collection") {
						mongoquery.dropCollection(node.collection, function (error) {
							if(error)
								console.log(error);
							else
								console.log("dropped collection", node.collection);
							callback(error);
							});
					} else {
						callback(); // we did nothing
					}
				},
				
				// if node is a source node, then remove its own records
				function (callback) {
					if(node.type == "source") {
						var query = {};
						query[MP.source] = node._id;
						mongoquery.empty(node.collection, query, function (error) {
							if(error)
								console.log(error);
							else
								console.log("data removed", node.collection);
							callback(error);
							});
					} else {
						callback(); // we did nothing
					}
				},

				// if node is a transform node, then remove its output field
				function (callback) {
					if((node.type == "transform" || node.type == "lookup") && node.out_field != null) {
						var field = {};
						var query = {};
						field[node.out_field] = 1;
						query["$unset"] = field;
						mongoquery.updateAll(node.collection, query, function (error) {
							if(error)
								console.log(error);
							else
								console.log("data removed", node.collection);
							callback(error);
							});
					} else {
						callback(); // we did nothing
					}
				},
				
				// if node is an interactive, then remove its init_fields
				function (callback) {
					if((node.type == "view") && node.init_fields != null) {
						console.log("REMOVING INIT FIELDS");
						var field = {};
						var query = {};
						for (var i = 0; i < node.init_fields.length; i++) {
							field[node.init_fields[i]] = 1;   
						}
						console.log(field);
						query["$unset"] = field;
						mongoquery.updateAll(node.collection, query, function (error) {
							if(error)
								console.log(error);
							else
								console.log("data removed", node.collection);
							callback(error);
							});
					} else {
						callback(); // we did nothing
					}
				},


			], function (err, results) {
				if(err) {
					console.log("ERROR:", err);
					res.json({"error": err.message});
				} else {
					mongoquery.update("mp_projects",
						{_id:mongojs.ObjectId(req.params.project)},
						{$pull:{nodes: {_id:mongojs.ObjectId(req.params.node)}}},
						function() {
							res.json({"status": "node deleted"});
							
					})
				}
			});


		} else {
			console.log("ERROR: project not found");
			return res.json({"error": "project not found (should not happen)"});
		}
	});
}

// checks if node is input node for some other node
function inputNode(node, nodes) {
	for(var i=0; i < nodes.length; i++) {
		if(nodes[i].input_node == node._id) {
			return true;
		}
	}
	return false;
}

/**
 * Get paged collection data
 * - gives records between skip and skip + limit
 */
exports.getCollection = function (req, query, res) {

	var limit = parseInt(req.query.limit);
	if (limit < 0 || isNaN(limit))
		limit = 15;

	var skip = parseInt(req.query.skip);
	if (skip <= 0 || isNaN(skip))
		skip = 0;

	var sort = req.query.sort
	if(typeof sort === 'undefined')  // by default sort by _id (mongoid)
		sort = "_id";

	var reverse = false
	var r = parseInt(req.query.reverse);
	if(!isNaN(r) && r == 1)  // reverse if reverse is 1
		reverse = true;

	var params = {
		collection: req.params.collection,
		query: query,
		limit: limit,
		skip: skip,
		sort: req.query.sort,
		reverse: reverse
	}
	mongoquery.findAll(params, function(data) { res.json(data) });
}
// AND search
exports.collectionSearch = function (req, res) {

	var limit = parseInt(req.query.limit);
	if (limit < 0 || isNaN(limit))
		limit = 15;

	var skip = parseInt(req.query.skip);
	if (skip <= 0 || isNaN(skip))
		skip = 0;

	var sort = req.query.sort
	if(sort === 'undefined')  // by default sort by _id (mongoid)
		sort = "_id";

	var reverse = false
	var r = parseInt(req.query.reverse);
	if(!isNaN(r) && r == 1)  // reverse if reverse is 1
		reverse = true;



	var s = ["skip", "limit", "sort", "reverse"];
	var query = {};
	for (var param in req.query) {
		console.log(param);
		if(!s.includes(param)) {
			if(Array.isArray(req.query[param])) {
				query[param] = {$all:req.query[param]};
			} else {
				query[param] = req.query[param];
			}
		}
	}
	console.log(query);
	//query[req.query.field] = {$regex:req.query.value, $options: 'i'};

	var params = {
		collection: req.params.collection,
		query: query,
		limit: limit,
		skip: skip,
		sort: req.query.sort,
		reverse: reverse
	}

	mongoquery.findAll(params, function (result) {
		res.send({data:result});
	});
	
}


/**
 * Get paged collection data for DataTable
 * - gives records between skip and skip + limit
 */
exports.getCollectionTableData = function (req, res) {

	// create search query
	var query = createSearchQuery(req);
	

	var limit = parseInt(req.query.limit);
	if (limit < 0 || isNaN(limit))
		limit = 15;

	var skip = parseInt(req.query.skip);
	if (skip <= 0 || isNaN(skip))
		skip = 0;

	var sort = req.query.sort
	if(sort === 'undefined')  // by default sort by _id (mongoid)
		sort = "_id";

	var reverse = false
	var r = parseInt(req.query.reverse);
	if(!isNaN(r) && r == 1)  // reverse if reverse is 1
		reverse = true;

	var params = {
		collection: req.params.collection,
		query: query,
		limit: limit,
		skip: skip,
		sort: req.query.sort,
		reverse: reverse
	}
	mongoquery.findAll(params, function(data) { res.json({data:data}) });
}

function createSearchQuery (req) {
	
	var query = {};
	if(req.query.query_fields) {
		// create an AND query if there are several query fields
		if(req.query.query_fields.length > 1) {
			var ands = [];
			for(var i = 0; i < req.query.query_fields.length; i++) {
				var search = {};
				search[req.query.query_fields[i]] = {$regex:req.query.query_values[i], $options: 'i'};
				ands.push(search);
			}
			query.$and = ands;
		// otherwise create query for one field
		} else {
			if(req.query.query_values[0] === "")
				query[req.query.query_fields[0]] =  "";
			else
				query[req.query.query_fields[0]] =  {$regex:req.query.query_values[0], $options: 'i'};
		}
	}
	return query;
}



exports.getCollectionByField = function (req, res) {

	var query = {};
	query[req.query.field] = {$regex:req.query.value, $options: 'i'};
	
	exports.getCollection (req, query, res);
}


exports.getDocumentById = function (req, res) {

	console.log(req.params.doc);
	console.log(req.params.id);
	mongoquery.findOneById(req.params.doc, req.params.id, function(result) {
		console.log(result);
		res.json({data:result});
	})
}




exports.getCollectionCount = function (req, cb) {
	
	var query = createSearchQuery(req);
	mongoquery.countDocs(req.params.collection, query, function (result) {
		cb({count:result});
	});
}


exports.getCollectionFacet = function (req, cb) {
	
	//var query = createSearchQuery(req);
	mongoquery.facet(req, function (result) {
		cb({count:result});
	});
}

exports.getCollectionFacetGroupBy = function (req, cb) {
	
	//var query = createSearchQuery(req);
	mongoquery.facetGroupBy(req, function (result) {
		cb({count:result});
	});
}


exports.getCollectionFacetTest = function (req, cb) {
	
	//var query = createSearchQuery(req);
	mongoquery.facetTest(req, function (result) {
		cb({count:result});
	});
}



exports.editCollection = function (req, callback) {

	var collection_id = req.params.collection
	console.log("editing", collection_id);
	if(!req.body.doc_id)
		return callback({error:"doc_id is missing!"});
		
	try {
		var doc_id = mongojs.ObjectId(req.body.doc_id)
	} catch (e) {
		return callback({error:"doc_id is invalid! It must be a valid MongoDB id."});
	}
	
	var setter = {};
	setter[req.body.field] = req.body.value;
	console.log("setter:", setter);
	
	mongoquery.update(collection_id, {_id:mongojs.ObjectId(req.body.doc_id)},{$set:setter}, function(result) {
		callback(result); 
	});
}

exports.editCollectionAddToSet = function (collection_id, req, callback) {

	console.log("adding to set", collection_id);
	var setter = {};
	setter[req.body.field] = req.body.value;
	console.log("setter:", setter);
	
	mongoquery.update(collection_id, {_id:mongojs.ObjectId(req.body.doc_id)},{$addToSet:setter}, function(result) {
		callback(result); 
	});
}


exports.nodeView = function  (req, cb) {
	fs = require('fs')
	fs.readFile("./app/views/view.html", 'utf8', function (err,view_html) {
		if (err) {
			console.log(err);
			return cb(err);
		} else {
			nodeview.createNodeView(view_html, req, false, function (html) {
				cb(html);
			});
		}

	});
}


exports.nodeEditView = function  (req, cb) {
	fs = require('fs')
	fs.readFile("./app/views/edit.html", 'utf8', function (err,data) {
		if (err) {
			console.log(err);
			return cb(err);
		} else {
			nodeview.createNodeView(data, req, true, function (html) {
				cb(html);
			});
		}
	});
}


exports.nodeFileView = function  (req, cb) {
	fs = require('fs')
	fs.readFile("./app/views/" + req.query.view, 'utf8', function (err,data) {
		if (err) {
			console.log(err);
			return cb(err);
		} else {
			nodeview.createNodeView(data, req, false, function (html) {
				cb(html);
			});
		}
	});
}




exports.getNodeLog = function (req, cb) {
	
	mongoquery.find({"node_uuid":req.params.id}, "mp_runlog", function(err, result) {
		if(err)
			return cb();
			
		result.forEach(function(row, i) {
			delete row.settings.password; // let's not send passwords...
			if(row.ts) {
				var date = new Date(row.ts);
				var y =  date.getUTCFullYear();
				var m =  date.getMonth() + 1;
				var d =  date.getDate();
				var h =  date.getHours();
				var mm =  date.getMinutes();
				var s =  date.getSeconds();
				var ss =  date.getMilliseconds();
				row.timestamp = y + "-" + m + "-" + d + " " + h + ":" + mm + ":" + s + "-" + ss;
			}
			
		});
		
		cb(result);
	})	
}


exports.getNodeParams = function (req, cb) {
	
	mongoquery.find({"nodeid":req.params.nodeid}, "mp_node_params", function(err, result) {
		if(err)
			console.log(err);
		cb(result);
	})	
}

exports.setNodeParams = function (req, cb) {

	var query = {nodeid:req.params.nodeid};
	
	mongoquery.find({"nodeid":req.params.nodeid}, "mp_node_params", function(err, result) {
		if(err)
			console.log(err);
		// if there is no node params for this node, then create that first	
		if(!result) {
			var doc = {
				nodeid:req.params.nodeid,
				url:[req.body.url]
			};
			mongoquery.insert("mp_node_params", doc, function(err, result) {
				cb(result);
			})
		// otherwise update the existing record	
		} else {
			var doc = {$addToSet:{url:req.body.url}}
			mongoquery.update("mp_node_params", query, doc, function(err, result) {
				if(err)
					console.log(err);
				cb(result);
			})			
		}
	})	

}

/**
 * Make an external API request
 * - called from runNode 
 * - makes request and return result
 */
exports.callAPI = function (url, callback) {
	var request = require("request");

	if (typeof url === "undefined" || url == "")
		callback("URL not set", null, null);

	console.log("REQUEST:", url);

	var headers = {
		'User-Agent':       'GLAMpipe/0.0.1',
	}

	 var options = {
		url: url,
		method: 'GET',
		headers: headers,
		json: true
	};

	request(options, function (error, response, body) {
		console.log(response.statusCode);
		if (error) {
			console.log("ERROR:", error);
			callback(error, response, body);
		} else if (response.statusCode == 200) {
			//console.log(body); 
			console.log("SERVER RESPONSE:", response.statusCode);
			callback(null, response, body);
		} else {
			console.log("SERVER RESPONSE:", response);
			callback("bad response from server:" + response.statusCode, response, body);
		}
	});
}


// *********************************************************************
// ******************************* APPLY ******************************
// *********************************************************************








exports.readDir = function (dirname, onFileList, onError) {
	var fs = require("fs");
	fs.readdir(dirname, function(err, filenames) {
		if (err) {
			onError(err);
			return;
		}
		onFileList(filenames);
	});
}



function indexByKeyValue(arraytosearch, key, value) {

	for (var i = 0; i < arraytosearch.length; i++) {
		if (arraytosearch[i][key] == value) {
			return i;
		}
	}
	return null;
}



exports.readNodes = function (io, nodePath, descriptions, callback) {
		
	readFiles(nodePath, function onNodeContent (filename, node, next) {
		// save node.json to db
		mongoquery.insert("mp_nodes",node , function(err, result) {
			if(err) {
				console.log(err);
			} else {
				console.log("LOADED: " + filename );
				if(io)
					io.sockets.emit("progress", "LOAD: " + filename + " loaded");
				next();
			}
		})

	}, function onError (error) {
		if( error.code == "ENOENT") {
			console.log("ERROR: No nodes present in " + nodePath);
			//console.log("You must fetch them from here: \nhttps://github.com/artturimatias/metapipe-nodes/archive/master.zip"); 
		} else {
			console.log(error);
		}
		return callback(error);

		
	}, function onDone () {
		console.log("INIT: nodes loaded from " + nodePath);
		console.log("******************************************");
		callback(null);
	});
}



function readFiles(dirname, onNodeContent, onError, onDone) {
	var fs = require("fs");
	
	// reas node directories
	fs.readdir(dirname, function(err, nodedirs) {
		if (err) {
			onError(err);
			return;
		}
		
		async.eachSeries(nodedirs, function iterator(nodedir, next) {
			fs.stat(dirname + nodedir, function(err, stat) {
				// read each node directory but skip "config" directory
				if ( nodedir == "config") {
					next();
				} else if (stat.isDirectory()) { 
					readNodeDirectory(path.join(dirname, nodedir), next, function (node) {
						onNodeContent(nodedir, node, next);
					}) 
                // skip files
				} else next();
			})
		// we have read all node directories
		}, function done() {
			onDone();
		});
	});
}



function readNodeDirectory (nodeDir, skip, cb) {
	console.log("READING directory: " + nodeDir);
	
	// read description.js from node directory
	fs.readFile(path.join(nodeDir, "description.json"), 'utf-8', function(err, content) {
		if (err) {
			console.log("Skipping", nodeDir);
			skip(); // we skip directory if there is no description.json
			return;
		} else {
			var node = JSON.parse(content);
            // make sure that we have "scripts" and "views"
            if(!node.scripts) node.scripts = {};
            if(!node.views) node.views = {};

			// join "pretty" settings
			if(node.views.settings instanceof Array)
				node.views.settings = node.views.settings.join("");	
				
			// join "pretty" params
			if(node.views.params instanceof Array)
				node.views.params = node.views.params.join("");	

			// join "pretty" data view
			if(node.views.data_static instanceof Array)
				node.views.data_static = node.views.data_static.join("");

			// join "pretty" scripts
			for (key in node.scripts) {
				if(node.scripts[key] instanceof Array)
					node.scripts[key] = node.scripts[key].join("");
			}

			// read each file in each node directory
			fs.readdir(nodeDir, function(err, nodeFiles) {
				if (err) {
					skip(err);
					return;
				}
                if(nodeFiles.length == 1) {
                    cb(node); return;
                }
				// read each file and add content to node
				async.eachSeries(nodeFiles, function iterator(nodeFile, next) {
					if(fs.statSync(path.join(nodeDir, nodeFile)).isDirectory()) {
						next();
					} else {js2Array(nodeDir, nodeFile, node, function() {
							next();
						})
					}
				// all files read. Return node object
				}, function done() {
					cb(node);
				})
			})
		}
	});
}


// transform js to array so that it can be placed inside JSON
function js2Array (dirName, fileName, node, cb) {
	
	var f = fileName.split(".");
	
	fs.readFile(path.join(dirName, fileName), 'utf-8', function(err, content) {
		if(err) {
			console.log(err);
		}
		var lines = content.split("\n");
		for (var i = 0; i < lines.length; i++) {
			lines[i] = lines[i].replace('"', '\"');
			lines[i] = lines[i].replace('\t', '  ');
		} 
		
		// add javascript files to "scripts" section
		if(f[1] == "js")
			node.scripts[f[0]] = lines.join("\n");
		// add html files to "views" section
		if(f[1] == "html")
			node.views[f[0]] = lines.join("\n");
		cb();
	})
}


function fileStats (sandbox, node, onScript, onError) {
	fs.stat(sandbox.out.pre_value, function (err, stats) {
		if(err)
			onError(err);
			
		sandbox.context.filestats = stats;
		onScript(sandbox);
	});
}


/**
 * Execute node's script without given context
 * - used in node creation
 * - node can say "hello" to user via out.say
 */
function runNodeScript (script, node, nodeParams, io) {
	var sandbox = {
		context: { node: node, noderequest: nodeParams},
		out: { say: function (ch, msg) {
				io.sockets.emit(ch, msg);
			}
		}
	}
	runNodeScriptInContext(script, node, sandbox, io);
}


function NodeScriptError (message) {
	this.message = message;
	this.name = "NodeScriptError";
}

function runNodeScriptInContext (script, node, sandbox, io) {
	try {
		vm.runInNewContext(node.scripts[script], sandbox);
	} catch (e) {
		if (e instanceof SyntaxError) {
			console.log("Syntax error in node.scripts."+script+"!", e);
			io.sockets.emit("error", "Syntax error in node.scripts."+script+"!</br>" + e);
			throw new NodeScriptError("syntax error:" + e.message);
		} else {
			console.log("Error in node.scripts."+script+"!",e);
			io.sockets.emit("error", "Error in node.scripts."+script+"!</br>" + e);
			throw new NodeScriptError(e.message);
		}
	}
}
