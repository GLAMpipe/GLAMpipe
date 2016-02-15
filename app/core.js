var multer 		= require("multer");
var mongojs = require('mongojs');
var async = require("async");
const vm = require('vm');
var mongoquery 	= require("../app/mongo-query.js");
var exports 	= module.exports = {};

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


exports.createProject = function (title, res) {
	console.log("creating project", title);

	// update project count and create project
	mongoquery.update("metapipe",{}, {$inc: { project_count: 1} }, function() {
		mongoquery.findOne({}, "metapipe", function(meta) {
			var short = title.substring(0,8);
			short = short.replace(" ","_");
			var project = {
				"title": title, 
				"prefix": short + "_p" + meta.project_count + "_"
				};
			mongoquery.insertProject (project, function(data) {
				res.json({"status": "project created"});
			});
		});
	});
}


exports.initNodes = function () {
	console.log("Loading node files...");
	var data = {};
	mongoquery.drop("nodes", function() {
		readFiles('nodes/', function(filename, content) {
			console.log(filename + " loaded");
			try {
				var parsed = JSON.parse(content);
				mongoquery.insert("nodes",parsed , function(error) {
					if(error.length) {
						console.log(error);
					}
				})
			} catch(e) {
				console.log("ERROR: JSON is malformed in", filename);
			}

		}, function(error) {
			console.log(error);
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
exports.runNode = function (req, res) {
	console.log('Running node:', req.params.id);
	mongoquery.findOne({"nodes._id":mongojs.ObjectId(req.params.id)}, "projects", function(project) {
		if(!project) {
			res.json({"error":"Node not found!"});
			return;
		}
		var index = indexByKeyValue(project.nodes, "_id", req.params.id);
		var node = project.nodes[index];
		node.settings = req.body;
		node.project = project._id;

		switch (node.type) {
			case "cluster":
				console.log("RUNNING CLUSTER NODE");
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
				console.log("RUNNING SOURCE NODE");
				var callback = function(data) {
					// context for node scripts
					var sandbox = {
						context: {
							node: node,
							console:console,
							data:data
						},
						out: {
							value:"",
							msg:""
						}
					};

					// let node pick the data it wants from result
					vm.runInNewContext(node.scripts.run, sandbox,"node.script.run");
					// empty collection
					mongoquery.empty(node.collection, {}, function() {
						// insert
						mongoquery.insert(node.collection, sandbox.out.value, function() {
							console.log("DONE SOURCE LOAD");
							vm.runInNewContext(node.scripts.after_run, sandbox, "node.script.after_run");
							//generate view and do *not* wait it to complete
							exports.generateView(node, function(msg) {
								console.log("VIEW:", msg);
							})
							res.json({msg:sandbox.out.msg, count:sandbox.out.value.length, status:"ok"})
						});
					});
				}
				
				if(node.subtype === "API") {
					exports.callAPI(node, callback);
				} else if (node.subtype === "file") {
					exports.importFile(node, callback);
				}
				
			break;
			
			
			default:
				if(typeof(node.scripts.run) !== "undefined") {
					exports.applyFuncForEach(node, function(error, count) {
						if(error) {
							res.json({"error": error});
							return;
						}
						console.log("DONE apply:", count);
						res.json({msg:node.msg, count:count, status:"ok"})
					});
				} else {
					console.log("No user defined function found!");
					res.json({"error":"No user defined function found!"});
				}
		}
		
	});
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
 
exports.createNode = function (nodeParams, res) {

	console.log("nEW", mongojs.ObjectId());
	console.log("nodeparams:", nodeParams);
	// copy node to project with its settings
	mongoquery.findOne({"nodeid":nodeParams.nodeid}, "nodes", function(node) {
		if(node) {
			node.input_node = nodeParams.input_node;
			node.params = nodeParams.params;
			node.collection = nodeParams.collection;
			// copy static data view to project node if defined
			if(typeof node.views.data_static !== "undefined")
				node.views.data = node.views.data_static;
			node.x = "0";
			node.y = "0";
			node._id = mongojs.ObjectId();
			console.log(node);
			mongoquery.update("projects",
				{_id:mongojs.ObjectId(nodeParams.project)},
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
 * Create source project node
 * - adds params defined by user to the stock node
 * - creates collection name
 * - saves result to project record (under "nodes")
 */
exports.createSourceNode = function (nodeRequest, res) {

	console.log("nEW", mongojs.ObjectId());
	
	// if we do not have collection name, then create it
	if(!nodeRequest.collection) {
		mongoquery.findOneById(nodeRequest.project, "projects", function(data) {
			nodeRequest.collection = data.prefix + nodeRequest.params.title;
			initNode(nodeRequest, res);
		});
	} else {
		initNode(nodeRequest, res);
	}
}

function initNode (nodeRequest, res) {
	// generate view
	//generateView(nodeRequest, function(view) {
		// copy node to project with its settings
		mongoquery.findOne({"nodeid":nodeRequest.nodeid}, "nodes", function(node) {
			if(node) {
				node.input_node = "";
				node.params = nodeRequest.params;
				node.collection = nodeRequest.collection;
				node.x = "0";
				node.y = "0";
				node._id = mongojs.ObjectId();
				mongoquery.update("projects",
					{_id:mongojs.ObjectId(nodeRequest.project)},
					{$push:{nodes: node}},
					function(error) {
						if(error) {
							console.log(error);
						}
						console.log("node created");
						res.json({"status": "node created"})
				})
			} else {
				console.log("node " + nodeRequest.nodeid + " not found!");
				res.json({"error": "node " + nodeRequest.nodeid + " not found"})
			}
		});
	//});
}

/**
 * Delete project node
 * - removes node
 * - if source or cluster node, then also removes collection
 */
exports.deleteNode = function (params, res) {

	mongoquery.findOne({"_id":mongojs.ObjectId(params.project)}, "projects", function(project) {
		if(project) {
			var index = indexByKeyValue(project.nodes, "_id", params.node);
			var node = project.nodes[index];
			// check that there is no nodes that depends on this node
			if(inputNode(node, project.nodes)) {
				return res.json({"error": "Can not remove node in the middle of the chain!"});
			}
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
					// if node is source or cluster, then also remove its collection
					
			})
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
 * - asks for url from node (node.scripts.url > sandbox.out.url)
 * - makes request and return result
 */
exports.callAPI = function (node, callback) {
	var request = require("request");

	 var options = {
		url: "",
		method: 'GET',
		json: true
	};

	// sandbox for node script
	var sandbox = {
		context: {
			node:node
		},
		out: {
			url:""
		}
	}
	
	try {
		vm.runInNewContext(node.scripts.url, sandbox);
		options.url = sandbox.out.url;
	} catch (e) {
		if (e instanceof SyntaxError) {
			console.log("Syntax error in url function!");
		} else {
			console.log("Error in url function!",e);
		}
		callback("Error in node function!", 0);
		return;
	}

	request(options, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body); 
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
exports.applyFuncForEach = function (node, callback) {
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
				console.log("not found");
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
		filenames.forEach(function(filename) {
			fs.readFile(dirname + filename, 'utf-8', function(err, content) {
				if (err) {
					onError(err);
					return;
				}
				onFileContent(filename, content);
			});
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
function callAPISerial (doc, node, onScript, onError) {

	var request = require("request");

	 var options = {
		url: "",
		method: 'GET',
		json: true
	};


	// sandbox for node script
	var sandbox = {
		context: {
			node:node,
			doc:doc
		},
		out: {
			url:"",
			value:""
		}
	}
	

	var onRequest = function(data) {
		sandbox.context.data = data;
		// let node pick the data it wants from result
		vm.runInNewContext(node.scripts.run, sandbox,"node.script.run");
		onScript(sandbox);
	}

	
	try {
		vm.runInNewContext(node.scripts.url, sandbox);
		options.url = sandbox.out.url;
		console.log(options.url);
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
