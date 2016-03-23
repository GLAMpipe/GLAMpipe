var multer 		= require("multer");
var mongojs 	= require('mongojs');
var async 		= require("async");
var colors 		= require('ansicolors');
var path 		= require("path");
const vm 		= require('vm');
var mongoquery 	= require("../app/mongo-query.js");
const MP 		= require("../config/const.js");
var exports 	= module.exports = {};


var positionOffset = 60;

/**
 * Create metapipe collection on start up
 * - "metapipe" is only collection that must exist
 * - makes sure that "project_count" exists
 */
exports.initDB = function (callback) {
	mongoquery.findOne({},"mp_settings", function(data) { 
		if(data) {
			console.log("DB: mp_settings exists");
			callback();
		} else {
			console.log("DB: creating project counter");
			mongoquery.insert("mp_settings", {"project_count":0}, function(result) {
				if(result.error)
					console.log("ERROR: could not create project counter!");
				else 
					callback();
			});
		}
	});
}

exports.initDir = function (callback) {

	fs.mkdir(MP.projects_dir, function(err) {
		if(err) {
			if(err.code === "EEXIST") {
				console.log("INIT: output directory exists");
				callback();
			} else
				console.log("ERROR:", err);
			return;
		}
		console.log("INIT: output directory created");
		callback();
	});

}

/**
 * load stock nodes
 * - reads .json files from "nodes" directory
 * - combines with descriptions from "node_type_descriptions.json"
 * - inserts nodes to "mp_nodes" collection
 */

exports.initNodes = function (callback) {
	console.log("INIT: Loading node files...");
	var data = {};
	mongoquery.drop("mp_nodes", function() {

		fs = require('fs')
		// read first node type descriptions
		fs.readFile("config/node_type_descriptions.json", 'utf8', function (err, data) {
			if(err)
				console.log("ERROR: node type descriptions not found!");
			else 
				var descriptions = JSON.parse(data);
				
			readFiles('nodes/', function(filename, content, next) {
				
				try {
					var node = JSON.parse(content);
					node.type_desc = descriptions[node.type];
					
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
						
					mongoquery.insert("mp_nodes",node , function(error) {
						if(error.length) {
							console.log(error);
						} else {
							console.log("INIT: " + filename + " loaded");
							next();
						}
					})
				} catch(e) {
					console.log(colors.red("ERROR: JSON is malformed in %s"), filename);
					next(); // continue anyway
				}

			}, function onError (error) {
				console.log(error);
				
			}, function onDone () {
				console.log("INIT: nodes loaded");
				callback();
			});
		});

	});
}


exports.createProject = function (title, res) {
	
	var dirs = ["download", "export", "source"];
	console.log("PROJECT: creating project", title);
	var title_dir = title.toLowerCase();
	title_dir = title_dir.replace(/[^a-z0-9- ]/g,"");
	title_dir = title_dir.replace(/[ ]/g,"_");
	// create projects/project_name directory 
	var projectPath = path.join(MP.projects_dir, title_dir); 
	fs.mkdir(projectPath, function(err) {
		if(err) {
			if(err.code === "EEXIST")
				console.log("Project directory exists");
			else
				console.log("ERROR:", err);
				
			res.json({"error": "error in project directory creation!"});
			return;
		}
		// create node output directories (blocking)
		for(var i = 0; i < dirs.length; i++) {
			fs.mkdirSync(path.join(projectPath, dirs[i]));
		} 
		// update project count and create project
		mongoquery.update("mp_settings",{}, {$inc: { project_count: 1} }, function() {
			mongoquery.findOne({}, "mp_settings", function(meta) {
				var collectionName = title_dir.substring(0,20).toLowerCase(); // limit 20 chars
				collectionName = collectionName.replace(/ /g,"_");
				var project = {
					"title": title,
					"dir": title_dir,
					"prefix": "p" + meta.project_count + "_" + collectionName ,
					"collection_count": 0,
					"node_count":0
				};
				mongoquery.insertProject (project, function(data) {
					console.log("project \"" + title + "\" created!");
					res.json({"status": "project created"});
				});
			});
		});
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

exports.getNode = function (node_id, res) {
	fs = require('fs')
	// read first node type descriptions
	var nodePath = path.join("nodes", node_id + ".json");
	fs.readFile(nodePath, 'utf8', function (err, data) {
		if(err) {
			console.log("ERROR: node not found!");
			res.json({"error": "node " + node_id + "not found!"});
		} else {
			res.json(JSON.parse(data));
		}
	});
}

/**
 * run project node based on node type
 * CLUSTER
 * - executes metapipe.cluster function
 * SOURCE - API
 * - calls metapipe.callAPI 
 * - executes script in node's scripts.run
 * SOURCE -FILE
 * - calls metapipe.importFile 
 * - executes script in node's scripts.run 
 * DEFAULT
 * - applies node's scripts.run to each record
 */ 
exports.runNode = function (req, res, io) {
	console.log('Running node:', req.params.id);
	io.sockets.emit("news", "NODE: running node " + req.params.id);
	
	try {

		mongoquery.findOne({"nodes._id":mongojs.ObjectId(req.params.id)}, "mp_projects", function(project) {
			if(!project) {
				console.log("node not found");
				io.sockets.emit("error", "node not found");
				return;
			}
			var index = indexByKeyValue(project.nodes, "_id", req.params.id);
			var node = project.nodes[index];
			if(typeof node.input_node !== 'undefined') {
				var index = indexByKeyValue(project.nodes, "_id", node.input_node);
				var input_node = project.nodes[index];
			} else {
				var input_node = null;
			}
			node.settings = req.body;
			node.project = project._id;

			// save node settings TODO: set callback
			mongoquery.editProjectNode(node._id, {"settings":node.settings}, function() {
				console.log("saved node settings");
			})

			console.log("NODE: running", node.type);

			// context for node scripts
			var sandbox = {
				context: {
					doc: null,
					data: null,
					node: node,
					input_node: input_node,
					doc_count:0,
					count:0
				},
				out: {
					value:"",
					url: "",
					file:"",
					error: null,
					console:console,
					say: function(ch, msg) {
						console.log(ch.toUpperCase() + ":", msg);
						io.sockets.emit(ch, msg);
					}
				},
				say: io.sockets.emit
			};
			vm.createContext(sandbox);
			
			switch (node.type) {
				
				
				case "cluster":
					
					var cluster_params = {
						collection: 'kartverket_source',
						field: 'data',
						array: true,
						new_collection: 'authors',
						callback: function (d) {
							res.json({"status": "clustered"});
						}
					}
					mongoquery.cluster(cluster_params);
				break;


				case "source":
				
					runNodeScriptInContext("init", node, sandbox, io);
					
					switch (node.subtype) {
						
						case "API":
						
							function requestLoop(){
								async.series([
									function (callback) {

										exports.callAPI(sandbox.out.url, function(data) {
											sandbox.context.data = data;
											sandbox.out.url = "";
											runNodeScriptInContext("run", node, sandbox, io);
											
											// add source id to data (expects out.value to be an array)
											for (var i = 0; i < sandbox.out.value.length; i++ ) {
												sandbox.out.value[i][MP.source] = node._id;
											}
											
											// insert data
											mongoquery.insert(node.collection, sandbox.out.value, function() {
												callback(null, sandbox.out.url);
											});
										});
									}

								], function(err, result){
									if (err)
										console.log(err);
										
									//generate view and do *not* wait it to complete
									if (!node.views.data)
										exports.updateView(node, sandbox, io, function(msg) {});
										
									// if node provides new url, then continue loop
									if (sandbox.out.url != "") {
										requestLoop()
									} else {
										runNodeScriptInContext("finish", node, sandbox, io);
										return;
									}
								}
							)};

							// start query loop
							requestLoop();
							
						break;
						
						
						case "file":
						
							function fileImport (data) {
								// provide data to node
								sandbox.context.data = data;
								
								// let node pick the data it wants from result
								runNodeScriptInContext("run", node, sandbox, io);

								// insert
								mongoquery.insert(node.collection, sandbox.out.value, function() {
									runNodeScriptInContext("finish", node, sandbox, io);
									//generate view and do *not* wait it to complete
									exports.updateView(node, sandbox, io, function(msg) {});
								});
								
							}
							
							// remove previous data insertet by node and import file
							var query = {}; 
							query[MP.source] = node._id;
							mongoquery.empty(node.collection, query, function() {
								exports.importFile(node, fileImport);
							});
								
						
						break;
						
					}



				break;

				
				case "export":

					// make sure that we have an export filename
					if(node.params.file == "") {
						console.log("ERROR: filename missing!");
						io.sockets.emit("error","ERROR: filename missing!");
						return;
					}

					// we stream directly to file
					var fs = require('fs');
					var filePath = path.join(node.dir, node.params.file);
					var wstream = fs.createWriteStream(filePath);
					

		
					// find everything
					mongoquery.find2({}, node.collection, function (err, doc) {
						
						// tell node how many records was found
						sandbox.context.doc_count = doc.length;
						runNodeScriptInContext("init", node, sandbox, io);
						wstream.write(sandbox.out.value);

						async.eachSeries(doc, function iterator(doc, next) {
							sandbox.context.doc = doc;
							sandbox.context.count++;
							runNodeScriptInContext("run", node, sandbox, io);
							if (sandbox.out.error !== null)  return;
							wstream.write(sandbox.out.value)
							next();
							
						}, function done() {
							runNodeScriptInContext("finish", node, sandbox, io);
							wstream.write(sandbox.out.value);
							wstream.end();

							//mongoquery.markNodeAsExecuted(node);
							return;
						});
					});

				break;



				case "lookup":
					
					
					var onError = function(err) {
						return;
					}
					
					// find everything
					mongoquery.find2({}, node.collection, function (err, doc) {
						
						sandbox.context.doc_count = doc.length;
						runNodeScriptInContext("init", node, sandbox, io);
						
						async.eachSeries(doc, function iterator(doc, next) {
							
							sandbox.context.doc = doc;
							sandbox.context.count++;
							// get URL for request from node
							runNodeScriptInContext("url", node, sandbox, io);
							if (sandbox.out.error !== null) return;
							
							// callback for updating record
							var onNodeScript = function (sandbox) {
								// let node pick the data it wants from result
								runNodeScriptInContext("run", node, sandbox, io);
								var setter = {};
								setter[node.params.field + node.params.suffix] = sandbox.out.value;
								mongoquery.update(node.collection, {_id:sandbox.context.doc._id},{$set:setter}, next);
							}

							callAPISerial (sandbox, node, onNodeScript, onError);

						}, function done() {
							runNodeScriptInContext("finish", node, sandbox, io);
						});
						
					}); 
				break;
				

				case "download":
					
					var callback = function() {
						
						// find everything
						mongoquery.find2({}, node.collection, function(err, doc) {
							sandbox.context.doc_count = doc.length;
							runNodeScriptInContext("init", node, sandbox, io);
							
							// run node once per record
							async.eachSeries(doc, function iterator(doc, next) {
								
								sandbox.context.doc = doc;
								sandbox.context.count++;
								
								// ask url and file name from node
								runNodeScriptInContext("run", node, sandbox, io);
								if (sandbox.out.error !== null) 
									return;
									
								exports.downloadFile(node, sandbox, function() {
									// write file location to db
									var setter = {};
									setter[sandbox.out.field] = path.join(node.dir, sandbox.out.file) ;
									mongoquery.update(node.collection, {_id:sandbox.context.doc._id},{$set:setter}, next);
								})
								
							}, function done() {
								runNodeScriptInContext("finish", node, sandbox, io);
							});
						});
					}
					
					// create node's output directory if it does not exist 
					// TODO: sanitize directory names
					var fs = require("fs");
					fs.mkdir(node.dir, function(err) {
						if(err) {
							if(err.code === "EEXIST") {
								console.log("INIT: output directory exists");
								callback();
							} else {
								console.log("ERROR:", err);
								io.emit("error", err)
								return;
							}
						} else {
							console.log("INIT: output directory created");
							callback();
						}
					});
					
				break;


				case "transform":
					
					// find everything
					mongoquery.find2({}, node.collection, function(err, doc) {
						sandbox.context.doc_count = doc.length;
						runNodeScriptInContext("init", node, sandbox, io);
						
						// run node once per record
						async.eachSeries(doc, function iterator(doc, next) {

							sandbox.context.doc = doc;
							sandbox.context.count++;
							runNodeScriptInContext("run", node, sandbox, io);

							var setter = {};
							setter[sandbox.out.field] = sandbox.out.value;
							console.log(setter);
							mongoquery.update(node.collection, {_id:sandbox.context.doc._id},{$set:setter}, next);
							
						}, function done () {
							runNodeScriptInContext("finish", node, sandbox, io);
							exports.updateView(node, sandbox, io, function(msg) {console.log("NODE: view created", msg);});
						});
					});

				break;


				case "upload":

					switch (node.subtype) {
						
						case "mediawiki_bot":
						
							var bot = require('nodemw');
							fs = require('fs');
							
							// ask bot config (username, pass etc.) from node
							runNodeScriptInContext("login", node, sandbox, io);
							var client = new bot(sandbox.out.botconfig);
							console.log(sandbox.context.node);
							console.log(sandbox.out.botconfig);

							client.logIn(sandbox.out.botconfig.username, sandbox.out.botconfig.password, function (err, data) {
								
								if(err) {
									io.sockets.emit("error", "Login failed!");
									return;
								}
								// find everything
								mongoquery.find2({}, node.collection, function(err, doc) {
									sandbox.context.doc_count = doc.length;
									runNodeScriptInContext("init", node, sandbox, io);
									
									// run node once per record
									async.eachSeries(doc, function iterator(doc, next) {

										sandbox.context.doc = doc;
										sandbox.context.count++;
										runNodeScriptInContext("run", node, sandbox, io);
										
										console.log("GETTING:",sandbox.out.title);
										// get revisions (to see if page exists)
										client.getArticle('File:' +sandbox.out.title, function (err, d) {
											if(err)
												console.log(err);
											if(d != null) {
												io.sockets.emit("error", 'Page exists!' + sandbox.out.title);
												console.log("CONTENT:", d);
												next();

											} else {

												fs.readFile(sandbox.out.filename, function (err,data) {
													if (err) {
														console.log(err);
														io.sockets.emit("error", err);
														next();	// continue despite the error
													}
													// upload file
													client.upload(sandbox.out.title, data, "uploaded with MetaPipe via nodemw", function (err, data) {
														if(err) {
															io.sockets.emit("error", err);
														} else {
															console.log(data.imageinfo.descriptionurl);
															
															// upload wikitext
															var content = sandbox.out.wikitext;
															client.edit('File:'+sandbox.out.title, content, 'test', function(err) {
																console.log('EDIT tethy'); 
																// write commons page url to db
																var setter = {};
																setter[sandbox.out.field] = data.imageinfo.descriptionurl;
																mongoquery.update(node.collection, {_id:sandbox.context.doc._id},{$set:setter}, next);
															});
														}
													});
												});
											}
											
										});
										
										
									}, function done () {
										runNodeScriptInContext("finish", node, sandbox, io);
									});
								});
							});

						break;
						
						
						default:
						
							runNodeScriptInContext("login", node, sandbox, io);
							
							// first we need to login
							login2API(node, sandbox, function () {
								// find everything
								mongoquery.find2({}, node.collection, function(err, doc) {
									sandbox.context.doc_count = doc.length;
									runNodeScriptInContext("init", node, sandbox, io);
									
									// run node once per record
									async.eachSeries(doc, function iterator(doc, next) {

										sandbox.context.doc = doc;
										sandbox.context.count++;
										runNodeScriptInContext("run", node, sandbox, io);

										
									}, function done () {
										runNodeScriptInContext("finish", node, sandbox, io);
									});
								});
							});
							
						break;
					}
				break;


				default:
					if(typeof(node.scripts.run) !== "undefined") {
						exports.applyFuncForEachAndUpdate(node, function(error, count) {
							if(error) {
								//res.json({"error": error});
								return;
							}
							console.log("DONE apply:", count);
							//res.json({msg:sandbox.out.msg, count:count, status:"ok"})
						});
					} else {
						console.log("No user defined function found!");
						//res.json({"error":"No user defined function found!"});
					}
			}
			
		});
		
	} catch (e) {
		console.log(e.name);
		io.sockets.emit("error", e.message);
	}
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


function getPrevNode(project, node) {
	for(var i=0; i > project.nodes.length; i++) {
		if(project.nodes[i]._id == node.in) {
			
		}
	}
}



/**
 * Generate/update data view for node
 * - if views.data_static is defined in node, then copy that to views.data
 * - else if script.view is defined, then let it create the view
 * - otherwise generate view based on keys in first record
 * */
exports.updateView = function (node, sandbox, io, callback) {
	
	if(node.views.data_static) {
		mongoquery.editProjectNode(node._id, {"views.data":node.views.data_static}, function() {
			return callback("using static");
		})
		
	} else if (node.scripts.view) {
		runNodeScriptInContext("view", node, sandbox, io);
		mongoquery.editProjectNode(node._id, {"views.data":sandbox.out.view}, function() {
			return callback("using view created by the node");
		})
		 
	
	} else {
		generateDynamicView(node, function(view) {
			mongoquery.editProjectNode(node._id, {"views.data":view}, function() {
				return callback("using dynamic");
			})
		}) 
	}

}




/**
 * updates project nodes x and y
*/ 
exports.setNodePosition = function (params, res) {

	var xx = params.x.replace(/px/,"");
	var yy = params.y.replace(/px/,"");
	mongoquery.editProjectNode(params.id, {"x": xx, "y": yy},
		function() {
			res.json({"status":"node position updated"});
		}
	);
}

exports.createNode = function (nodeRequest, res, io) {

	mongoquery.findOneById(nodeRequest.project, "mp_projects", function(project) {
		nodeRequest.node_count = project.node_count;
		mongoquery.update("mp_projects",{_id:mongojs.ObjectId(nodeRequest.project)}, {$inc: { node_count: 1} }, function() {
			initNode(nodeRequest, res, io, project);
		});
	});
}


/**
 * Create default project node
 * - adds params defined by user to the stock node
 * - saves result to project record (under "nodes")
 */
 
function initNode (nodeRequest, res, io, project) {

	console.log("nEW", mongojs.ObjectId());
	console.log("nodeparams:", nodeRequest);
	
	// callback for inserting node to db
	var insertNode = function (node, cb) {
		mongoquery.update("mp_projects",
			{_id:mongojs.ObjectId(node.project)},
			{$push:{nodes: node}},
			function(error) {
				cb(error);
		})
	}
	
	// copy node to project with its settings
	mongoquery.findOne({"nodeid":nodeRequest.nodeid}, "mp_nodes", function(node) {
		if(node) {
			node.input_node = nodeRequest.input_node;
			node.project = nodeRequest.project
			node.collection = nodeRequest.collection;
			node.number = nodeRequest.node_count;
			
			if(nodeRequest.params)
				node.params = nodeRequest.params;
			else
				node.params = {};
				
			node.params.collection = nodeRequest.collection;
			
			// copy static data view to project node's view if defined
			if(typeof node.views.data_static !== "undefined")
				node.views.data = node.views.data_static;
			
			// let's place node near parent node	
			node.x = parseInt(nodeRequest.position.left) + positionOffset;
			node.y = parseInt(nodeRequest.position.top) + positionOffset;
			
			runNodeScript("hello", node, nodeRequest, io);
			
			node._id = mongojs.ObjectId();
			
			// create output directory for nodes that do file output
			if(node.type == "download" || node.type == "export" || node.type == "source") {
				var fs = require("fs");
				var dir = path.join(MP.projects_dir, project.dir, node.type, project.node_count + "_" + node.nodeid);
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
								res.json({"status": "node created"})
							}
						});
					}
				});
			} else {
				insertNode(node, function (err) {
					if(err) {
						console.log(err);
						res.json({"error": err});
					} else {
						console.log("node created");
						res.json({"status": "node created"})
					}
				});
			}
			


		} else {
			console.log("ERROR: node not found");
		}
	});
}



/**
 * Create source project node
 * - adds params defined by user to the stock node
 * - creates collection name
 * - saves result to project record (under "nodes")
 */
exports.createCollectionNode = function (nodeRequest, res, io) {

	mongoquery.findOneById(nodeRequest.project, "mp_projects", function(data) {
		// cleanup name
		collectionName = nodeRequest.params.title.replace(/[^a-z0-9- ]/g,"").toLowerCase();
		
		nodeRequest.collection = data.prefix + "_c" + data.collection_count + "_" + collectionName;
		nodeRequest.params.collection = nodeRequest.collection;
		nodeRequest.node_count = data.node_count;
		mongoquery.update("mp_projects",{_id:mongojs.ObjectId(nodeRequest.project)}, {$inc: { collection_count: 1, node_count: 1} }, function() {
			mongoquery.createCollection(nodeRequest.collection, function () {
				initCollectionNode(nodeRequest, res, io);
			});
		})
	});
}

function initCollectionNode (nodeRequest, res, io) {
	
	// copy node to project with its settings
	mongoquery.findOne({"nodeid":nodeRequest.nodeid}, "mp_nodes", function(node) {
		if(node) {
			node.input_node = "";
			node.project = nodeRequest.project;
			if(nodeRequest.params)
				node.params = nodeRequest.params;
			else
				node.params = {};
			node.collection = nodeRequest.collection;
			node.number = nodeRequest.node_count;
			node.x = "350";
			node.y = "0";
			
			runNodeScript("hello", node, nodeRequest, io);
			
			node._id = mongojs.ObjectId();
			mongoquery.update("mp_projects",
				{_id:mongojs.ObjectId(node.project)},
				{$push:{nodes: node}},
				function(error) {
					if(error) {
						console.log(error);
						res.json({"error": error});
					}
					console.log("node created");
					res.json({"status": "node created"})

			})
		} else {
			console.log("node " + nodeRequest.nodeid + " not found!");
			res.json({"error": "node " + nodeRequest.nodeid + " not found"})
		}
	});
}

/**
 * Delete project node
 * - removes node
 * - if collection node, then also removes collection
 * - if source node, then also removes node's data
 */
exports.deleteNode = function (params, res, io) {

	mongoquery.findOne({"_id":mongojs.ObjectId(params.project)}, "mp_projects", function(project) {
		if(project) {
			var index = indexByKeyValue(project.nodes, "_id", params.node);
			var node = project.nodes[index];
			// check that there is no nodes that depends on this node
			if(inputNode(node, project.nodes)) {
				return res.json({"error": "Can not remove node with child nodes!"});
			}

			// allow node to say bye
			runNodeScript("bye", node, null, io);

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
				}

			], function (err, results) {
				if(err) {
					console.log("ERROR:", err);
					res.json({"error": err.message});
				} else {
					mongoquery.update("mp_projects",
						{_id:mongojs.ObjectId(params.project)},
						{$pull:{nodes: {_id:mongojs.ObjectId(params.node)}}},
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
exports.getCollection = function (req, res) {

	var limit = parseInt(req.query.limit);
	if (limit <= 0 || isNaN(limit))
		limit = 50;

	var skip = parseInt(req.query.skip);
	if (skip <= 0 || isNaN(skip))
		skip = 0;

	var sort = req.query.sort
	if(sort === 'undefined')  // by default sort by _id (mongoid)
		sort = "_id";


	var params = {
		collection: req.params.id,
		limit: limit,
		skip: skip,
		sort: req.query.sort,
		reverse: false
	}
	mongoquery.findAll(params, function(data) { res.json(data) });
}


exports.getCollectionFields = function (collection_id, cb) {
	mongoquery.findOne({}, collection_id, function(data) {
		if(!data) {
			cb({"error":"collection is empty!"});
		} else {
			cb (data);
		}
		
		//return;
		//var keys = {};
		//for (key in data) {
			//var type = typeof data[key];

			//keys[key] = typeof data[key];

		//}
		//cb(keys);
	});
}


exports.nodeView = function  (nodeId, cb) {
	fs = require('fs')
	fs.readFile("./app/views/view.html", 'utf8', function (err,data) {
		if (err) {
			return console.log(err);
		}
		createNodeView(data, nodeId, function (html) {
			cb(html);
		});

	});
}

/**
 * Generate collection view page
 * - combines base view html (view.html) to node's data view (views.data)
 */
exports.viewCollection = function  (collectionName, cb) {
	fs = require('fs')
	fs.readFile("./app/views/view.html", 'utf8', function (err,data) {
		if (err) {
			return console.log(err);
		}
		createCollectionView(data, collectionName, function (html) {
			cb(html);
		});

	});
}


exports.uploadFile = function (req, res ) {
	
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
		
		default:
			console.log("File type: unidentified!");
			return res.json({"error":"File type unidentified!"});
	}
}


exports.importFile = function (node, callback) {
	switch (node.params.mimetype) {
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
			importTSV("tsv", node, function(data) {
				callback(data);
			})
		break;
		case "text/csv":
			console.log("File type: comma separated values");
			importTSV("csv", node, function(data) {
				callback(data);
			})
		break;
		default:
			console.log("File type: unidentified!");
			//return res.json({"error":"File type unidentified!"});
			return;
	}
}

/**
 * Make an external API request
 * - called from runNode 
 * - makes request and return result
 */
exports.callAPI = function (url, callback) {
	var request = require("request");

	var headers = {
		'User-Agent':       'MetaPipe/0.0.1',
	}

	 var options = {
		url: url,
		method: 'GET',
		headers: headers,
		json: true
	};

	request(options, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			//console.log(body); 
			callback(body);
		} else {
			console.log(error);
			callback();
			return;
		}
	});
}


// *********************************************************************
// ******************************* APPLY ******************************
// *********************************************************************


exports.applyFunc = function (func, params, callback) {
	var count = 0;
	db.collection('kartverket_source').find().forEach(function (err, doc) {
		
		if (!doc) {
			// we visited all docs in the collection
			callback();
		}
		// doc is a document in the collection
		console.log(count + ": "+ doc.author);
		count++;
	});
}

/**
 * Apply node script to records
 * - applies node function (scripts.run) to a certain field of all records
 * - writes result to user defined field
 * - data in and out goes through "sandbox"
 */
exports.exportXML = function (node, callback) {
	var count = 0;
	
	if(typeof node.collection  === "undefined") {
		console.log("ERROR: collection not found");
		callback("ERROR: collection not found");
		return;
	}
	
	var onDoc = function (doc) {
		console.log(doc.WD);
		console.log(node.settings.WD);
		vm.runInNewContext(node.scripts.run, sandbox, "node.script.run");
	}
	
	var onError = function (error) {
		console.log(error);
	}
	
	var onDone = function() {
		callback();
	}
	
	mongoquery.find2({}, node.collection, function (err, doc) {
		console.log("documents found:", doc.length);
		console.log(node.params);
		
		async.eachSeries(doc, function iterator(doc, next) {
			onDoc(doc);
			next();
		}, function done() {
			callback(null, count);
		});
		
	}); 
}


/**
 * Apply node script to records
 * - applies node function (scripts.run) to a certain field of all records
 * - writes result to user defined field
 * - data in and out goes through "sandbox"
 */
exports.applyFuncForEachAndUpdate = function (node, callback) {
	var count = 0;
	
	if(typeof node.collection  === "undefined") {
		console.log("ERROR: collection not found");
		callback("ERROR: collection not found");
		return;
	}

	mongoquery.find2({}, node.collection, function (err, doc) {
		console.log("documents found:", doc.length);
		console.log(node.params);
		
		async.eachSeries(doc, function iterator(doc, next) {
			if(typeof(doc[node.params.field]) !== "undefined") {
				
				// callback for updating record
				var onNodeScript = function (sandbox) {
					var setter = {};
					setter[node.params.field + node.params.suffix] = sandbox.out.value;
					mongoquery.update(node.collection, {_id:sandbox.context.doc._id},{$set:setter}, next);
					count++;
				}
				
				if(node.type === "lookup") {
					callAPISerial (doc, node, onNodeScript, callback);
				} else if (node.type === "transform") {
					runSyncNode (doc, node, onNodeScript, callback);
				} else {
					callback("ERROR: node type not recognised!", 0);
				}
				

			} else {
				console.log("ERROR: params.field not found");
				next();
			}
		}, function done() {
			callback(null, count);
		});
		
	}); 
}



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


exports.downloadFile = function (node, sandbox, cb ) {
	var fs = require("fs");
	var request = require("request")
	
	var filePath = path.join(node.dir, sandbox.out.file); 
	var file = fs.createWriteStream(filePath);
	var sendReq = request.get(sandbox.out.url);

	// verify response code
	sendReq.on('response', function(response) {
		if (response.statusCode !== 200) {
			return cb('Response status was ' + response.statusCode);
		}
	});

	// check for request errors
	sendReq.on('error', function (err) {
		fs.unlink(filePath);

		if (cb) {
			return cb(err.message);
		}
	});

	sendReq.pipe(file);

	file.on('finish', function() {
		file.close(cb);  // close() is async, call cb after close completes.
	});

	file.on('error', function(err) { 
		fs.unlink(filePath); // Delete the file async. 
		console.log(err);

		if (cb) {
			return cb(err.message);
		}
	});

}

function insertNodeActionField (collection, doc_id, field, value) {
	
}

function importXML(file) {
	
}


function importTSV (mode, node, cb) {
	
	var streamCSV = require("node-stream-csv");

	var records = [];
	var file = path.join("uploads", node.params.filename);
	streamCSV({
		filename: file,
		mode: mode,
		dontguess: true },
		function onEveryRecord (record) {
			var count = 0;
			var empty = 0;
			for(var prop in record) {

				if (record.hasOwnProperty(prop)) {
					// clean up key names (remove -. and convert spaces to underscores)
					prop_trimmed = prop.trim();
					prop_clean = prop_trimmed.replace(/[\s-.]/g, '_');
					if(prop != prop_clean) {
						record[prop_clean] = record[prop];
						delete record[prop];
					}

					count++;
					if(typeof record[prop_clean] === "undefined" || record[prop_clean] == "")
						empty++;
				}
			}
			// check for totally empty records
			//if(empty != count)
			
			// mark origin of data
			record[MP.source] = node._id;
			records.push(record);
		},
		function onReady () {
			cb(records);
		}
	);
}



function importJSON(filename, collection, res, cb) {
	fs = require('fs')
	fs.readFile("uploads/" + filename + ".json", 'utf8', function (err,data) {
		if (err) {
			return console.log(err);
		}
		var json = JSON.parse(data);
		mongoquery.save(collection, json, function() {cb(collection);});
		


	});
}


function writeJSON2File (filename, records, callback) {

	require('fs').writeFile(
		"uploads/" + filename + ".json",
		JSON.stringify(records, null, ' '),
		function write2DB (err) {
			callback();
		}
	)

}




function generateDynamicView(node, callback) {
	// read one record and extract field names
	// NOTE: this assumes that every record has all fields
	mongoquery.findOne({}, node.collection, function(data) {
		
		if(data) {

			if(data.__mp_source)
				delete data.__mp_source;

			var html = ''
				+ '<button data-bind="click: prevPage">prev</button>'
				+ '<button data-bind="click: nextPage">next</button>'

				+ '<div id="node_bar" class="selected">'
				+ '</div>'

				+ '<div>'
				+ '	<table>'
				+ '		<thead>'
				+ '			<tr>';

			html += '			<th id="vcc" data-bind="click: sort">[count]</th>'

			for (key in data) {
				html += '			<th id="'+key+'" data-bind="click: sort">'+key+'</th>'
			}

			html += '			</tr>'
				+ '		</thead>'
				+ '		<tbody data-bind="foreach: collection">'
				+ '			<tr>';

			// data cells
			html += '				<td data-bind="text: vcc"></td>'
			for (key in data) {
				
				if(data[key].constructor.name === 'Array') {
					html += '				<td data-bind="foreach: '+key+'"><div data-bind="text:$data"></div></td>'
				} else if(typeof data[key] === "object" && key != "_id") {

					html += '				<td data-bind="text:'+key+',click:$root.openCell"><a href="">show details</a><div class="details"></div></td>'

				} else {
					html += '				<td data-bind="text: '+key+'"></td>'
				}
			}

			html += '			</tr>'
				+ '		</tbody>'
				+ '	</table>'
				+ '</div>';

			callback(html);
		} else {
			callback("<h3>dynamice view creation failed!</h3> Maybe collection is empty?</br>" + node.collection);
		}
	});
}



function createCollectionView(data, collectionName, callback) {
	mongoquery.findOne({"nodes.collection":collectionName}, "mp_projects", function(project) {
		var index = indexByKeyValue(project.nodes, "collection", collectionName);
		data = data.replace(/\[\[project\]\]/, project.title);

		// insert node's html view to view.html
		if(typeof project.nodes[index].views.data === "undefined") {
			generateDynamicView(project.nodes[index], function(msg) {
				data = data.replace(/\[\[html\]\]/, project.nodes[index].views.data);
				callback(data);
			});
		} else {
			data = data.replace(/\[\[html\]\]/, project.nodes[index].views.data);
			callback(data);
		}
		
		
	});
}

function createNodeView(data, nodeId, callback) {
	mongoquery.findOne({"nodes._id":mongojs.ObjectId(nodeId)}, "mp_projects", function(project) {
		if(project) {
			var index = indexByKeyValue(project.nodes, "_id", nodeId);
			var node = project.nodes[index];
			data = data.replace(/\[\[project\]\]/, project.title);
			data = data.replace(/\[\[page_title\]\]/, node.title);
			data = data.replace(/\[\[node\]\]/, "var node = " + JSON.stringify(node));
			
			// if node has no view, then we create in always on the fly (dynamic view)
			if(typeof project.nodes[index].views.data === "undefined") {
				generateDynamicView(project.nodes[index], function(html) {
					// insert node's data view to view.html
					data = data.replace(/\[\[html\]\]/, html);
					callback(data);
				});
			} else {
				// insert node's data view to view.html
				data = data.replace(/\[\[html\]\]/, project.nodes[index].views.data);
				callback(data);
			}
		} else {
			callback("<h1>Node view not found</h1><p>Maybe you deleted the node?</p>");
		}
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


function readFiles(dirname, onFileContent, onError, onDone) {
	var fs = require("fs");
	fs.readdir(dirname, function(err, filenames) {
		if (err) {
			onError(err);
			return;
		}

		async.eachSeries(filenames, function iterator(filename, next) {
			fs.readFile(dirname + filename, 'utf-8', function(err, content) {
				if (err) {
					onError(err);
					return;
				}
				onFileContent(filename, content, next);
			});
		}, function done() {
			onDone();
		});

	});
}


/**
 * Execute node script (except for source nodes)
 */ 
function runSyncNode (doc, node, onScript, onError) {
	
	// sandbox for node script
	var sandbox = {
		context: {
			node:node,
			doc:doc
		},
		out: {
			value:""
		}
	}
	
	try {
		vm.runInNewContext(node.scripts.run, sandbox, "node.scripts.run");
		onScript(sandbox);
		
	} catch (e) {
		if (e instanceof SyntaxError) {
			console.log("Syntax error in node function!", e);
		} else {
			console.log("Error in node function!", e);
		}
		onError("Error in node function!\n" + e, count);
		return;
	}
}

/**
 * Make HTTP request in the record context
 */ 
function callAPISerial (sandbox, node, onScript, onError) {

	var request = require("request");

	 var options = {
		url: "",
		method: 'GET',
		json: true
	};

	
	try {
		vm.runInNewContext(node.scripts.url, sandbox);
		console.log(sandbox.out.url);
		options.url = sandbox.out.url;
	} catch (e) {
		if (e instanceof SyntaxError) {
			console.log("Syntax error in url function!");
		} else {
			console.log("Error in url function!",e);
		}
		onError("Error in node function!", 0);
		return;
	}

	// make actual HTTP request
	request(options, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			sandbox.context.data = body;
			onScript(sandbox)
		} else {
			console.log(error);
			onError(error);
			return;
		}
	});

}
