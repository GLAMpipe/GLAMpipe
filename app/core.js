var multer 		= require("multer");
var mongojs = require('mongojs');
var async = require("async");
var path = require("path");
const vm = require('vm');
var mongoquery 	= require("../app/mongo-query.js");
var exports 	= module.exports = {};

var positionOffset = 20;

/**
 * Create metapipe collection on start up
 * - "metapipe" is only collection that must exist
 * - makes sure that "project_count" exists
 */
exports.initDB = function () {
	mongoquery.findOne({},"metapipe", function(data) { 
		if(data) {
			console.log("DB: project counter exists");
		} else {
			console.log("DB: creating project counter");
			mongoquery.insert("metapipe", {"project_count":0}, function(result) {
				if(result.error)
					console.log("ERROR: could not create project counter!");
				return;
			});
		}
	});
}


/**
 * load stock nodes
 * - reads .json files from "nodes" directory
 * - combines with descriptions from "node_type_descriptions.json"
 * - inserts nodes to "nodes" collection
 */

exports.initNodes = function () {
	console.log("Loading node files...");
	var data = {};
	mongoquery.drop("nodes", function() {

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

					// join "pretty" hello script
					if(node.scripts.hello instanceof Array)
						node.scripts.hello = node.scripts.hello.join("");

					// join "pretty" bye script
					if(node.scripts.bye instanceof Array)
						node.scripts.bye = node.scripts.bye.join("");

					// join "pretty" init script
					if(node.scripts.init instanceof Array)
						node.scripts.init = node.scripts.init.join("");

					// join "pretty" url script
					if(node.scripts.url instanceof Array)
						node.scripts.url = node.scripts.url.join("");

					// join "pretty" run script
					if(node.scripts.run instanceof Array)
						node.scripts.run = node.scripts.run.join("");
						
					// join "pretty" after_run script
					if(node.scripts.finish instanceof Array)
						node.scripts.finish = node.scripts.finish.join("");
						
					mongoquery.insert("nodes",node , function(error) {
						if(error.length) {
							console.log(error);
						} else {
							console.log("NODE: " + filename + " loaded");
							next();
						}
					})
				} catch(e) {
					console.log("ERROR: JSON is malformed in", filename);
					next(); // continue anyway
				}

			}, function onError (error) {
				console.log(error);
			});
		});

	});
}


exports.createProject = function (title, res) {
	console.log("creating project", title);

	var title_dir = title.replace(/ /g,"_").toLowerCase();
	// create output/project_name directory 
	var projectPath = path.join("output", title_dir); 
	fs.mkdir(projectPath, function(err) {
		if(err) {
			if(err.code === "EEXIST")
				console.log("Project directory exists");
			res.json({"status": "error in output directory creation!"});
			return;
		}
		// update project count and create project
		mongoquery.update("metapipe",{}, {$inc: { project_count: 1} }, function() {
			mongoquery.findOne({}, "metapipe", function(meta) {
				var short = title.substring(0,16).toLowerCase();
				short = short.replace(/ /g,"_");
				var project = {
					"title": title,
					"dir": title_dir,
					"prefix": "p" + meta.project_count + "_" + short,
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
	mongoquery.findOneById(doc_id, "projects", function(data) { res.json(data) });
}


exports.getNodes = function (res) {
	//mongoquery.find({}, "nodes", function(data) { res.json(data) });
	mongoquery.nodes( function(data) { res.json(data) });
}


exports.getProjectNodes = function (project, res) {
	mongoquery.findOneById(project, "projects", function(data) { res.json(data) });
}


exports.getNodeSettings = function (node_id, res) {
	mongoquery.findOneById(node_id, "nodes", function(data) { res.json(data) });
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
	
	mongoquery.findOne({"nodes._id":mongojs.ObjectId(req.params.id)}, "projects", function(project) {
		if(!project) {
			res.json({"error":"Node not found!"});
			return;
		}
		var index = indexByKeyValue(project.nodes, "_id", req.params.id);
		var node = project.nodes[index];
		node.settings = req.body;
		node.project = project._id;
		node.dir = project.dir;

		console.log("NODE: running", node.type);

		// context for node scripts
		var sandbox = {
			context: {
				doc: null,
				data: null,
				node: node,
				doc_count:0,
				count:0
			},
			out: {
				value:"",
				url: "",
				file:"",
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
									exports.generateView(node, function(msg) {});
									
								// if node provides new url, then continue loop
								if (sandbox.out.url != "") {
									requestLoop()
								} else {
									runNodeScriptInContext("finish", node, sandbox, io);
									return;
								}
							}
						)};

						// empty collection and start query loop
						mongoquery.empty(node.collection, {}, function() {
							requestLoop();
						});
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
								exports.generateView(node, function(msg) {});
							});
							
						}
						
						// empty collection and import file
						mongoquery.empty(node.collection, {}, function() {
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
				var filePath = path.join("output", node.dir, node.params.file);
				var wstream = fs.createWriteStream(filePath);
				
				runNodeScriptInContext("init", node, sandbox, io);
				wstream.write(sandbox.out.value);
	
				// find everything
				mongoquery.find2({}, node.collection, function (err, doc) {
					// tell node how many records was found
					sandbox.context.doc_count = doc.length;

					// TODO: there is really no need to async here
					async.eachSeries(doc, function iterator(doc, next) {
						sandbox.context.count++;
						sandbox.context.doc = doc;
						runNodeScriptInContext("run", node, sandbox, io);
						wstream.write(sandbox.out.value)
						next();
						
					}, function done() {
						//finish.runInNewContext(sandbox);
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
					runNodeScriptInContext("init", node, sandbox, io);
					async.eachSeries(doc, function iterator(doc, next) {

						sandbox.context.doc = doc;
						// callback for updating record
						var onNodeScript = function (sandbox) {
							var setter = {};
							setter[node.params.field + node.params.suffix] = sandbox.out.value;
							mongoquery.update(node.collection, {_id:sandbox.context.doc._id},{$set:setter}, next);
						}
						
						// get URL for request from node
						runNodeScriptInContext("url", node, sandbox, io);
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
						runNodeScriptInContext("init", node, sandbox, io);
						
						// run node once per record
						async.eachSeries(doc, function iterator(doc, next) {
							sandbox.context.data = doc;
							runNodeScriptInContext("run", node, sandbox, io);
							exports.downloadFile(node, sandbox, function() {
								next();
							})
						
						}, function done() {
							runNodeScriptInContext("finish", node, sandbox, io);
						});
					});
				}
				
				callback();
				
			break;
			

			case "transform":
				
				// find everything
				mongoquery.find2({}, node.collection, function(err, doc) {
					runNodeScriptInContext("init", node, sandbox, io);
					
					// run node once per record
					async.eachSeries(doc, function iterator(doc, next) {

						sandbox.context.doc = doc;
						runNodeScriptInContext("run", node, sandbox, io);

						var setter = {};
						setter[node.params.field + node.params.suffix] = sandbox.out.value;
						mongoquery.update(node.collection, {_id:sandbox.context.doc._id},{$set:setter}, next);
						
					}, function done () {
						runNodeScriptInContext("finish", node, sandbox, io);
					});
				});

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
}


function executeNodeScript(script, sandbox, script_name) {
	
	try {
		vm.runInNewContext(script, sandbox, script_name);
	} catch (e) {
		if (e instanceof SyntaxError) {
			console.log("ERROR: syntax error in node", e);
			sandbox.error = "syntax error in node:" + e;
		} else {
			console.log(e);
			sandbox.error = e;
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
 * Generats data view for project node
 * - if views.data_static is defined in node, then copy that to views.data
 * - otherwise generate view based on kyes in first record
 * */
exports.generateView = function (node, callback) {
	
	if(typeof node.views.data == "undefined" || node.views.data == "" ) {
		if(node.views.data_static) {
			mongoquery.editProjectNode(node._id, {"views.data":node.views.data_static}, function() {
				return callback("using static");
			})
		} else {
			generateView(node, function(view) {
				mongoquery.editProjectNode(node._id, {"views.data":view}, function() {
				return callback("using dynamic");
				})
			}) 
		}
	} else {
		callback("exists");
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

/**
 * Create default project node
 * - adds params defined by user to the stock node
 * - saves result to project record (under "nodes")
 */
 
exports.createNode = function (nodeRequest, res, io) {

	console.log("nEW", mongojs.ObjectId());
	console.log("nodeparams:", nodeRequest);
	// copy node to project with its settings
	mongoquery.findOne({"nodeid":nodeRequest.nodeid}, "nodes", function(node) {
		if(node) {
			node.input_node = nodeRequest.input_node;
			node.params = nodeRequest.params;
			node.collection = nodeRequest.collection;
			node.params.collection = nodeRequest.collection;
			
			// copy static data view to project node's view if defined
			if(typeof node.views.data_static !== "undefined")
				node.views.data = node.views.data_static;
			
			// let's place node near parent node	
			node.x = parseInt(nodeRequest.position.left) + positionOffset;
			node.y = parseInt(nodeRequest.position.top) + positionOffset;
			
			runNodeScript("hello", node, nodeRequest, io);
			
			node._id = mongojs.ObjectId();
			//console.log(node);
			mongoquery.update("projects",
				{_id:mongojs.ObjectId(nodeRequest.project)},
				{$push:{nodes: node}},
				function() {
					res.json({"status": "node created"})
			})
		} else {
			console.log("ERROR: node not found");
		}
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


function runNodeScriptInContext (script, node, sandbox, io) {

	try {
		vm.runInNewContext(node.scripts[script], sandbox);
	} catch (e) {
		if (e instanceof SyntaxError) {
			console.log("Syntax error in node.scripts."+script+"!", e);
			io.sockets.emit("error", "Syntax error in node.scripts."+script+"!</br>" + e);
		} else {
			console.log("Error in node.scripts."+script+"!",e);
			io.sockets.emit("error", "Error in node.scripts."+script+"!</br>" + e);
		}
	}
}

/**
 * Create source project node
 * - adds params defined by user to the stock node
 * - creates collection name
 * - saves result to project record (under "nodes")
 */
exports.createSourceNode = function (nodeRequest, res, io) {

	console.log("nEW", mongojs.ObjectId());
	
	// if we do not have collection name, then create it
	if(!nodeRequest.collection) {
		mongoquery.findOneById(nodeRequest.project, "projects", function(data) {
			nodeRequest.collection = data.prefix + "_c" + data.collection_count + "_" +nodeRequest.params.title;
			nodeRequest.params.collection = nodeRequest.collection;
			mongoquery.update("projects",{_id:mongojs.ObjectId(nodeRequest.project)}, {$inc: { collection_count: 1} }, function() {
				initNode(nodeRequest, res, io);
			})
		});
	} else {
		initNode(nodeRequest, res, io);
	}
}

function initNode (nodeRequest, res, io) {
	
	// copy node to project with its settings
	mongoquery.findOne({"nodeid":nodeRequest.nodeid}, "nodes", function(node) {
		if(node) {
			node.input_node = "";
			node.params = nodeRequest.params;
			node.collection = nodeRequest.collection;
			node.x = "350";
			node.y = "0";
			
			runNodeScript("hello", node, nodeRequest, io);
			
			node._id = mongojs.ObjectId();
			mongoquery.update("projects",
				{_id:mongojs.ObjectId(nodeRequest.project)},
				{$push:{nodes: node}},
				function(error) {
					if(error) {
						console.log(error);
					}
					mongoquery.update("projects",{_id:mongojs.ObjectId(nodeRequest.project)}, {$inc: { node_count: 1} }, function() {
						console.log("node created");
						res.json({"status": "node created"})
					});
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
 * - if source or cluster node, then also removes collection
 */
exports.deleteNode = function (params, res, io) {

	mongoquery.findOne({"_id":mongojs.ObjectId(params.project)}, "projects", function(project) {
		if(project) {
			var index = indexByKeyValue(project.nodes, "_id", params.node);
			var node = project.nodes[index];
			// check that there is no nodes that depends on this node
			if(inputNode(node, project.nodes)) {
				return res.json({"error": "Can not remove node in the middle of the chain!"});
			}
			
			// allow node to say bye
			runNodeScript("bye", node, null, io);
			
			// if node is source or cluster node, then also remove its collection
			if(node.type == "source" || node.type == "cluster") {
				mongoquery.dropCollection(node.collection, function (error) {
					if(error)
						console.log(error);
					else
						console.log("dropped collection", node.collection);
					});
			} 
			mongoquery.update("projects",
				{_id:mongojs.ObjectId(params.project)},
				{$pull:{nodes: {_id:mongojs.ObjectId(params.node)}}},
				function() {
					res.json({"status": "node deleted"});
					
				}
			)
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


exports.getCollectionFields = function (collection_id, res) {
	mongoquery.findOne({}, collection_id, function(data) {
		var keys = [];
		for (key in data) {
			keys.push(key);
		}
		unset(keys["_id"]);
		res.json(keys);
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
	
	var filePath = path.join("output", node.dir, sandbox.out.file); 
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
		fs.unlink(dest);

		if (cb) {
			return cb(err.message);
		}
	});

	sendReq.pipe(file);

	file.on('finish', function() {
		file.close(cb);  // close() is async, call cb after close completes.
	});

	file.on('error', function(err) { 
		fs.unlink(dest); // Delete the file async. 
		console.log(err);

		if (cb) {
			return cb(err.message);
		}
	});

}

function importXML(file) {
	
}


function importTSV (mode, node, cb) {
	
	var streamCSV = require("node-stream-csv");

	var records = [];
	streamCSV({
		filename: "uploads/" + node.params.filename,
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
					if(record[prop_clean] === "undefined" || record[prop_clean] == "")
						empty++;
				}
			}
			// check for totally empty records
			if(empty != count)
				records.push(record);
		},
		function onReady () {
			cb(records);
		}
	);
}


function importCSV (req) {
	var streamCSV = require("node-stream-csv");

	streamCSV({
		filename: "uploads/" + req.file.filename,
		mode: "cvs",
		dontguess: true },
		function(record) {
			console.log(record);
			console.log('*************');
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




function generateView(node, callback) {
	// read one record and extract field names
	// NOTE: this assumes that every record has all field names
	mongoquery.findOne({}, node.collection, function(data) {

		var html = ''
			+ '<button data-bind="click: prevPage">prev</button>'
			+ '<button data-bind="click: nextPage">next</button>'

			+ '<div id="node_bar" class="selected">'
			+ ' <h2 class="selected">TOOLS</h2>'
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
			html += '				<td data-bind="text: '+key+'"></td>'
		}

		html += '			</tr>'
			+ '		</tbody>'
			+ '	</table>'
			+ '</div>';

		callback(html);
	});
}



function createCollectionView(data, collectionName, callback) {
	mongoquery.findOne({"nodes.collection":collectionName}, "projects", function(project) {
		var index = indexByKeyValue(project.nodes, "collection", collectionName);
		data = data.replace(/\[\[project\]\]/, project.title);

		// insert node's html view to view.html
		if(typeof project.nodes[index].views.data === "undefined")
			data = data.replace(/\[\[html\]\]/, '<h2>View not created</h2>Run node first!');
		else
			data = data.replace(/\[\[html\]\]/, project.nodes[index].views.data);
		
		callback(data);
	});
}

function createNodeView(data, nodeId, callback) {
	mongoquery.findOne({"nodes._id":mongojs.ObjectId(nodeId)}, "projects", function(project) {
		var index = indexByKeyValue(project.nodes, "_id", nodeId);
		data = data.replace(/\[\[project\]\]/, project.title);
		data = data.replace(/\[\[node\]\]/, "var node = " + JSON.stringify(project.nodes[index]));
		// insert node's data view to view.html
		if(typeof project.nodes[index].views.data === "undefined")
			data = data.replace(/\[\[html\]\]/, '<h2>View not created</h2>Run node first!');
		else
			data = data.replace(/\[\[html\]\]/, project.nodes[index].views.data);
			
		callback(data);
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


function readFiles(dirname, onFileContent, onError) {
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
			console.log("Node init done!");
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

	var onRequest = function(data) {
		sandbox.context.data = data;
		// let node pick the data it wants from result
		vm.runInNewContext(node.scripts.run, sandbox,"node.script.run");
		onScript(sandbox);
	}
	
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
			onRequest(body);
		} else {
			console.log(error);
			onError(error);
			return;
		}
	});

}
