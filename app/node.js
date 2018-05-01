
var mongojs 	= require('mongojs');
var async 		= require("async");
var colors 		= require('ansicolors');
var path 		= require("path");
var flatten 	= require("flat");
const vm 		= require('vm');
var mongoquery 	= require("../app/mongo-query.js");
var buildquery 	= require("../app/query-builder.js");
const MP 		= require("../config/const.js");
var exports 	= module.exports = {};

var exports = module.exports = {};


exports.run = function(req, io, res) {

	//console.log('NODE RUN: node:', req.params.id);
	io.sockets.emit("news", "NODE: running node " + req.params.id);

	exports.getNode(req.params.id, function(err, node) {
		if(err) {
			console.log("node not found: " + req.params.id);
			io.sockets.emit("error", "node not found");
			delete global.register[req.originalUrl];
			if(res) {
				res.status(404).json({error:"node not found: " + req.params.id});
			}
			return;
		}
		// preserve user defined node description
		if(!req.body["node_description"] && node.settings["node_description"]) {
			req.body["node_description"] = node.settings["node_description"];
		}
		node.settings = req.body;
		node.req = req;	
		// we make copy of settings that is saved to db so that we can remove certain fields (passwds etc.)
		// from it without affecting settings that are used by node
        var settings_copy = Object.assign({}, node.settings) 
		
		// save node settings
		exports.saveSettings(node._id, settings_copy, function() {

			console.log("\n>>>>>>>>>>>>>> RUNNING NODE >>>>>>>>>>>>>>>>>>>>>>>>");
			console.log("title: " + node.title);
			console.log("type: ", node.type);
			console.log("subtype: ", node.subtype);
			console.log("node params:");
			console.log(node.params);
			console.log("node settings:");
			console.log(node.settings);
			console.log("request params:");
			console.log(req.params);
			console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n");
			
			if(res)
				node.res = res;
			
			try {
				require("../app/run-switch.js").runNode(node, io);
			} catch (e) {
				console.log("ERROR:" + e.message);
				delete global.register[node.req.originalUrl];
				io.sockets.emit("error", e.message);
			}
		})

	})

}

exports.getNodeInputs = function(node) {
	var inputs = [];
	for(var key in node.params) {
		if(/^in_/.test(key))
			inputs.push(node.params[key]);
	}
	for(var key in node.settings) {
		if(/^in_/.test(key))
			inputs.push(node.settings[key]);
	}
	return inputs;
}


exports.getNodeOutputs = function(node) {
	var outputs = [];
	for(var key in node.params) {
		if(/^out_/.test(key))
			outputs.push(node.params[key]);
	}
	for(var key in node.settings) {
		if(/^out_/.test(key))
			outputs.push(node.settings[key]);
	}
	return outputs;
}

// edit node settings
exports.saveSettings = function (doc_id, settings, callback) {
    
    // we do not save passwords, user names and api keys
    if(settings) {
		if(settings.username) settings.username = null;
		if(settings.passwd) settings.passwd = null;
		if(settings.password) settings.password = null;
		if(settings.apikey) settings.apikey = null;
		if(settings.key_credential) settings.key_credential = null;
		if(settings.key_identity) settings.key_identity = null;
	}

	// we don't save empty setting values
	for(var key in settings) {
		if(!settings[key])
			delete settings[key];
	}

	if(!settings)
		return callback();
		
	var setter = {};
	setter.$set = {"nodes.$.settings": settings};
	var query = {"nodes._id": mongojs.ObjectId(doc_id)};
	mongoquery.updateSingle("mp_projects", query, setter, function() {
		callback();
	})
}

// edit node content
exports.edit = function (doc_id, doc, callback) {

	var keys = Object.keys(doc)
	var key = "nodes.$." + keys[0];
	var setter = {$set:{}};
	setter.$set[key] =  doc[keys[0]];
	var query = {"nodes._id": mongojs.ObjectId(doc_id)};
	mongoquery.updateSingle("mp_projects", query, setter, function(err, result) {
		callback(err, result);
	})
}


exports.getNode = function (node_id, cb) {

	try {
		mongoquery.findOne({"nodes._id":mongojs.ObjectId(node_id)}, "mp_projects", function(err, project) {
			if(!project) {
				return cb("not found", null);
			}
			
			var index = indexByKeyValue(project.nodes, "_id", node_id);
			var node = project.nodes[index];

			node.project = project._id;
			node.project_title = project.title;
			node.project_dir = project.dir;
			node.inputs = exports.getNodeInputs(node);
			node.outputs = exports.getNodeOutputs(node);

			// in nodeDevMode we load node scripts directly from directory 
			if(global.config.nodeDevMode && node.src_dir) {
				loadScriptsFromFile(node, function(err, node) {
					if(err)
						cb("error in loading!", null);
					else
						cb(null, node);
				})
			} else {
				cb(null, node);	
			}
		})
	} catch(e) {
		console.log(e.message);
		return cb(e.message, null);
	}
}


exports.getNodeSettings = function (node_id, cb) {

	exports.getNode(node_id, function(err, node) {
		if(!err)
			cb(node.settings);	
		else 
			return cb({});
	})
}


exports.getNodeParams = function (node_id, cb) {

	exports.getNode(node_id, function(err, node) {
		if(!err)
			cb(node.params);	
		else 
			return cb({});
	})
}

function loadScriptsFromFile(node, cb) {
	if(node.src_dir) {
		console.log("DEV MODE: loading node source " + node.src_dir)
		var skip = function() {cb("error in loading!", null)};
		readNodeDirectory(node.src_dir, skip, function(nodeFromDir) {
			node.scripts = nodeFromDir.scripts;
			cb(null, node);	
		})
	} else {
		cb(null, node);	
	}
}

exports.getNodeScripts = function (req, cb) {

	exports.getNode(req.params.id, function(err, node) {
		if(!err) {

			if(req.params.script && node.scripts[req.params.script])
				cb(node.scripts[req.params.script]);	
			else
				cb(node.scripts);					
			
		} else 
			return cb({});
	})
}

exports.getCollectionNodes = function (collection_id, cb) {

	mongoquery.findWithResultFields(
		{ nodes:
			{$elemMatch:
				{collection:collection_id}
			}
		}, 
		{
			"nodes.nodeid":1,
			"nodes.version":1,
			"nodes.type":1,
			"nodes._id":1,
			"nodes.project":1,
			"nodes.params":1,
			"nodes.settings":1,
			
		}
		, "mp_projects"
		, function(err, nodes) {
			if(!err)
				cb(nodes);	
			else 
				return cb([]);
	})
}


exports.getProjectByNode = function (node_id, cb) {

	try {
		mongoquery.findOne({"nodes._id":mongojs.ObjectId(node_id)}, "mp_projects", function(err, project) {
			if(!project) {
				return cb("not found", null);
			}
			cb(null, project);	
		})
	} catch(e) {
		console.log(e.message);
		return cb(e.message, null);
	}
}


exports.createNode = function (req, res, io) {
	
	if(req.query.type && req.query.type === "collection") {
		exports.createCollectionNode(req, res, io);
	} else {

		mongoquery.findOneById(req.params.project, "mp_projects", function(project) {
			req.node_count = project.node_count;
			mongoquery.update("mp_projects",{_id:mongojs.ObjectId(req.params.project)}, {$inc: { node_count: 1} }, function() {
				initNode(req, io, project, function(data) {
					res.json(data);
				});
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
		if(req.body.params.title) {
			collectionName = req.body.params.title.toLowerCase().replace(/[^a-z0-9-]/g,"");
		}
		
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



function createMetaSubNodes (node, io, cb) {
	
	//var nodes = [
		//{
			//collection: node.collection,
			//nodeid: "process_field_split",
			//params: {
				//in_field: node.params.in_field,
				//out_field:"meta1_split"
				//}
		//},
		//{
			//collection: node.collection,
			//nodeid: "process_field_count_chars",
			//params: {
				//in_field:"meta1_split",
				//out_field:"meta1_count"
				//}
		//}
	//]
	
	var nodes = node.pipe;
	
	var nodelist = [];
	//nodes.reverse();

	// create nodes
	require("async").eachSeries(nodes, function iterator (nodeitem, next) {
		console.log("CREATING SUBNODE");
		var req = {params:{}, body:{}};
		req.body.params = nodeitem.params;
		req.body.params.parent = node._id;
		req.body.collection = nodeitem.collection;
		req.params.project = node.project;
		req.params.nodeid = nodeitem.nodeid;
		req.node_count = node.number;
		req.node_count++;
		
		mongoquery.findOneById(node.project, "mp_projects", function(project) {
			mongoquery.update("mp_projects",{_id:mongojs.ObjectId(node.project)}, {$inc: { node_count: 1} }, function() {
				initNode(req, io, project, function(data) {
					nodelist.push(data.id);

					console.log("data.id:" + data.id)
					next();
				});
			});
		});		
	}, function done () {
		console.log("DONE ASYNC CREATING OF SUBNODES")
		// write subnode ids to metanode
		exports.edit(node._id, {"subnodes":nodelist}, function() {
			cb();
		})
		
	});
	

}

/**
 * Create default project node
 * - adds params defined by user to the stock node
 * - saves result to project record (under "nodes")
 */
 
function initNode (req, io, project, callback) {

	console.log("NODE CREATION: New node id:", mongojs.ObjectId());
	console.log("NODE CREATION: nodeparams:", req.params);
	
	// callback for inserting node to db
	var insertNode = function (node, cb) {
		
		mongoquery.update("mp_projects",
			{_id:mongojs.ObjectId(node.project)},
			{$push:{nodes: node}},
			function(error) {
				// if node is metanode, then we must continue to subnode creation
				if (node.subtype == "meta") {
					createMetaSubNodes(node, io, cb);
				} else {
				  cb(error);
			  }
		})
	}
	
	// copy node to project with its settings
	mongoquery.findOne({"nodeid":req.params.nodeid}, "mp_nodes", function(err, node) {
		if(node) {
			node.project = req.params.project
			node.collection = req.body.collection;
			node.number = req.node_count;
			node.dirsuffix = ""; // node can set this in "hello" script
			node.version = global.config.version;
			
			if(req.body.params)
				node.params = req.body.params;
			else
				node.params = {};


			// node creation can also include settings for running node 
			if(req.body.settings)
				node.settings = req.body.settings;
			else
				node.settings = {};

			node.params.collection = node.collection;
			
			//runNodeScript("hello", node, req, io);
			runNodeScript("metanodes", node, req, io);  // sets "node.pipe"
			node._id = mongojs.ObjectId();

			// "out_field" overrides "_suffix" set by hello script
			if(node.params.out_field)
				node.out_field = node.params.out_field;
			

			//if(node.type !== "source") {
				// add all output keys (starting with "out_") to all records
			var add_keys = [];
			for(var key in node.params) {
				if(/^out_/.test(key) && node.params[key] && node.params[key] !== "")
					add_keys.push(node.params[key]);
				// all "in_" fields must have value
				if(/^in_/.test(key) || /^required_/.test(key)) {
					if(!node.params[key] || (node.params[key] && node.params[key] == "")) {
						console.log("NODE CREATION: missing input, canceling...")
						return callback({"error": "input field missing: " + key});
					}

				}
			}
			
			mongoquery.addFieldToCollection(node.collection, add_keys, function(){
				console.log("NODE CREATION: '" + add_keys + "' added to collection");
			
				// create node directories
				createNodeDirs(node, project, function(err) {
					// create node
					insertNode(node, function(err) {
						if(err) {
							console.log(err);
							callback({"error": err});
						} else {
							console.log("NODE CREATION: node created!");
							callback({
								status:'node created', 
								id:node._id, 
								node:node,
								collection:node.collection,
								nodeid: node.nodeid
							})
						}
					});					
				})

			});


		} else {
			console.log("ERROR: node not found");
		}
	});
}







function createNodeDirs (node, project, cb) {
	if(node.type !== "source" && node.type !== "process" && node.type !== "export" && node.type !== "view")
		return cb(null);
		
	var fs = require("fs");
	var dir = path.join(global.config.projectsPath, project.dir, node.type,  node.nodeid + "_" + project.node_count );
	fs.mkdir(dir, function(err) {
		if(err) {
			console.log("ERROR:", err);
			io.sockets.emit("error", "Could not create node's output directory!");
			cb({"error":"Could not create node's output directory!"});
			//return res.json({"error":"Could not create node's output directory!"});
				
		} else {
			console.log("NODE CREATION: output directory created");
			node.dir = dir;
			cb(null);
		}
	});	
}


function initCollectionNode (req, res) {
	
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
			
			//runNodeScript("hello", node, req, io);
			
			node._id = mongojs.ObjectId();
			mongoquery.update("mp_projects",
				{_id:mongojs.ObjectId(node.project)},
				{$push:{nodes: node}},
				function(error) {
					if(error) {
						console.log(error);
						res.json({"error": error});
					} else {
						console.log("NODE CREATION: node created");
						res.json({
							"status": "node created", 
							"collection":node.collection, 
							"title": node.params.title,
							"nodeid": node.nodeid
							})
					}

			})
		} else {
			console.log("ERROR: node " + req.nodeid + " not found!");
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
			if(!node) {
				console.log("ERROR: node not found");
				return res.status(404).json({error:"Node not found:" + req.params.node});
				
			}

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

				// if node is a transform node, then remove its output fields
				function (callback) {
					if(node.type != "source") {
						// delete all output keys (starting with "out_") from all records
						var del_keys = {};
						for(var key in node.params) {
							if(/^out_/.test(key) && node.params[key] && node.params[key] !== "") {
								del_keys[node.params[key]] = "";
							}
						}

						if(Object.keys(del_keys).length) {
							var query = {};
							query["$unset"] = del_keys;
							mongoquery.updateAll(node.collection, query, function (error) {
								if(error) {
									console.log(error);
								} else {
									// TODO:  we need to remove keys from shcema too
									console.log("DB: keys removed", node.collection);
								}
								callback(error);
							});
						} else {
							callback(); // we did nothing
						}
					} else {
						callback(); //we did nothing
					}
				},

				// if node is a metanode, then remove its subnodes
				function (callback) {
					if(node.subtype === "meta" && node.subnodes) {
						var baseurl = "http://localhost:3000"; // localhost does not require authentication
						require("async").eachSeries(node.subnodes, function iterator (subnode, next) {
							var url = baseurl + "/api/v1/projects/"+node.project+"/nodes/" + subnode;
							console.log("REMOVING: node " + subnode);	
							
							var options = {
								url: url,
								headers: {
									"accept": "application/json"
								}
							};
							if(req.headers.authorization)
								options.headers.authorization = req.headers.authorization;
							
							var request = require("request");
							//require('request').debug = true;

							// make actual HTTP request
							request.delete(options, function (error, response, body) {
								if (error) {
									console.log(error);
									next();
								} else {
									next();
								}
							});
						}, function done () {
							console.log("METANODE: deleted all subnodes!");
							callback();
						})

					} else {
						callback(); // we did nothing
					}
				},

				// remove node directory
				function(callback) {
					var rimraf = require("rimraf");	
					if(node.dir && node.dir.includes(config.dataPath)) {
						console.log("NODE: removing " + node.dir);
						rimraf(node.dir, callback);
					} else {
						callback();
					}
					
				}


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




exports.getNodeLog = function (node_id, cb) {
	
	mongoquery.find({"node_uuid": node_id}, "mp_runlog", function(err, result) {
		if(err)
			return cb();
			
		result.forEach(function(row, i) {
			delete row.settings.password; // be sure to not expose passwords...
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


// save node specific options used in node params (currently only URLs)
exports.setOptions = function (req, cb) {

	var query = {nodeid:req.params.nodeid};
	
	mongoquery.find({"nodeid":req.params.nodeid}, "mp_node_options", function(err, result) {
		if(err)
			console.log(err);
		// if there is no node params for this node, then create that first	
		if(!result) {
			var doc = {
				nodeid:req.params.nodeid,
				url:[req.body.url]
			};
			mongoquery.insert("mp_node_options", doc, function(err, result) {
				cb(result);
			})
		// otherwise update the existing record	
		} else {
			var doc = {$addToSet:{url:req.body.url}}
			mongoquery.update("mp_node_options", query, doc, function(err, result) {
				if(err)
					console.log(err);
				cb(result);
			})			
		}
	})	
}


exports.getOptions = function (req, cb) {
	
	mongoquery.find({"nodeid":req.params.nodeid}, "mp_node_options", function(err, result) {
		if(err)
			console.log(err);
		cb(result);
	})	
}

exports.getNodeFile = function (req, res) {
	exports.getNodeKey("dir", req.params.nodeid, function(err, data) {
		if(err)
			res.status(404).json({error:"File not found!"});
		else {
			var file = path.join(data.value,req.params.file);
			res.sendFile(file, function(err) {
				if(err)
					res.status(404).json({error:"File not found!"});
			});

		}
	})	
}

exports.getNodeKey = function (key, nodeid, cb) {
	
	mongoquery.findProjectNode(nodeid, function(err, project) {
		if(err)
			console.log(err);
		if(project && project.nodes[0]) {
			cb(null, {key:"node." + key, value:project.nodes[0][key]});
		} else {
			cb({"error":"not found"});
		}
	})	
}



exports.setNodeDescription = function (req, cb) {

	exports.getNode(req.params.nodeid, function(err, node) {
		if(!err) {
			if(node.settings)
				node.settings.node_description = req.body.description;
			else {
				node.settings = {"node_description": req.body.description};
			}
			exports.edit(node._id, {"settings":node.settings}, function(err, result) {
				if(err)
					cb(err);
				else
					cb(result);
			})			
		} else {
			cb({});
		}
	})
}


exports.readNodes = function (io, nodePath, callback) {
		
	var list = walkSync(nodePath, []);

	mongoquery.insert("mp_nodes", list , function(err, result) {
		if(err) {
			console.log(err);
		} else {
			console.log("INIT: " + list.length + " nodes loaded from " + nodePath);
			callback(null);
		}
	})
}



var walkSync = function(dir, nodeList) {
	var fs = fs || require('fs'),
	files = fs.readdirSync(dir);
	nodeList = nodeList || [];
	files.forEach(function(file) {
		if (fs.statSync(dir + file).isDirectory()) {
			nodeList = walkSync(dir + file + '/', nodeList);
		}
		else if(file == "description.json"){
			//filelist.push(dir);
			nodeList.push(readNodeDirectorySync(dir));
		}
	});
	return nodeList;
};



function readNodeDirectorySync (nodeDir) {
	console.log("READING directory: " + nodeDir);
	
	// read description.js from node directory
	var content = fs.readFileSync(path.join(nodeDir, "description.json"), 'utf-8');
	
	if (!content) {
		console.log("INIT: Skipping", nodeDir);
		skip(); // we skip directory if there is no description.json
		return;
	} else {
		var node = JSON.parse(content);
		node.src_dir = nodeDir; // save *real* source dir
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

	}
	
	var files = fs.readdirSync(nodeDir);
	files.forEach(function(fileName) {
		if (!fs.statSync(path.join(nodeDir, fileName)).isDirectory()) {
			 //var nodeFile = fs.readFileSync(path.join(nodeDir, fileName));
			 js2ArraySync(nodeDir, fileName, node);
		}
	});
	return node;
}


// transform js to array so that it can be placed inside JSON
function js2ArraySync (dirName, fileName, node) {
	
	var f = fileName.split(".");
	
	var content = fs.readFileSync(path.join(dirName, fileName), 'utf-8')
	if(!content) {
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

	
}

function readNodeDirectory (nodeDir, skip, cb) {
	
	// read description.js from node directory
	fs.readFile(path.join(nodeDir, "description.json"), 'utf-8', function(err, content) {
		if (err) {
			console.log("INIT: Skipping", nodeDir);
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
 * load stock nodes
 * - reads .json files from "nodes" directory
 * - combines with descriptions from "node_type_descriptions.json"
 * - inserts nodes to "mp_nodes" collection
 */

exports.initNodes = function (nodePath, io, callback) {
		
	mongoquery.drop("mp_nodes", function() {

		console.log("INIT: Loading nodes from " + path.join(nodePath, "/") );
		exports.readNodes(io, path.join(nodePath, "/"), function (error) {
			if(error){
				// otherwise default nodes (included in the image)
				console.log("ERROR: Loading nodes failed!");
				callback(error);

			} else
				callback(null);     
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


/**
 * updates nodes visible fields
*/ 
exports.setVisibleFields = function (nodeid, params, res) {

	exports.edit(nodeid, {"visible_keys": params.keys},
		function() {
			res.json({"status":"node updated"});
		}
	);
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



function indexByKeyValue(arraytosearch, key, value) {

	for (var i = 0; i < arraytosearch.length; i++) {
		if (arraytosearch[i][key] == value) {
			return i;
		}
	}
	return null;
}


// creates an object for mongoquery array update wiht positional operator ($)
function createParamsObject(arrayName, params) {

	var result = {};
	for (var p in params) {
		if( params.hasOwnProperty(p) && p != "apikey") {
		  result[arrayName + "." + p] =  params[p];
		} 
	}
    //console.log("******************************");
    //console.log(params);
    //console.log(result);
    //console.log("******************************");
	return result;
}

