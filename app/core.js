var multer 		= require("multer");
var mongojs = require('mongojs');
var async = require("async");
var mongoquery 	= require("../app/mongo-query.js");
var exports 	= module.exports = {};


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

		switch (node.type) {
			case "cluster":
				console.log("CLUSTER NODE");
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
			default:
				if(typeof(node.func) !== "undefined") {
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


exports.setNodePosition = function (params, res) {

	var xx = params.x.replace(/px/,"");
	var yy = params.y.replace(/px/,"");
	mongoquery.editProjectNode(params.id, {"x": xx, "y": yy},
		function() {
			res.json({"status":"node position updated"});
		}
	);
}


exports.createNode = function (nodeParams, res) {

	console.log("nEW", mongojs.ObjectId());
	console.log("nodeparams:", nodeParams);
	// generate view
	//generateView(nodeParams, function(view) {
		// copy node to project with its settings
		mongoquery.findOne({"nodeid":nodeParams.nodeid}, "nodes", function(node) {
			if(node) {
				node.input_node = nodeParams.input_node;
				node.params = JSON.parse(nodeParams.params);
				node.collection = nodeParams.collection;
				node.x = "0";
				node.y = "0";
				node._id = mongojs.ObjectId();
				//node.collection = nodeParams.collection;
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
	//});
}

exports.createSourceNode = function (nodeParams, res) {

	console.log("nEW", mongojs.ObjectId());
	console.log(nodeParams);
	// generate view
	generateView(nodeParams, function(view) {
		// copy node to project with its settings
		mongoquery.findOne({"nodeid":nodeParams.nodeid}, "nodes", function(node) {
			if(node) {
				node.data_view = view;
				node.input_node = "";
				node.params = JSON.parse(nodeParams.params);
				node.data_description = nodeParams.data_description;
				node.data_title = nodeParams.title;
				node.collection = nodeParams.collection;
				node.x = "0";
				node.y = "0";
				node._id = mongojs.ObjectId();
				mongoquery.update("projects",
					{_id:mongojs.ObjectId(nodeParams.project)},
					{$push:{nodes: node}},
					function(error) {
						if(error)
							console.log(error);
						res.json({"status": "node created"})
				})
			} else {
				console.log("node " + nodeParams.nodeid + " not found!");
				res.json({"error": "node " + nodeParams.nodeid + " not found"})
			}
		});
	});
	//mongoquery.insert ("nodes", node, function(data) {
		//res.json({"status": "node created"});
	//});
}



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


exports.importFile = function (req, res ) {
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
			importTSV("tsv", req, res, function(collection) {
				return res.json({
					"status": "ok",
					filename:req.file.filename,
					title: req.body.title,
					nodeid: req.body.nodeid,
					project: req.body.project,
					collection: collection,
					data_description: req.body.data_description
				}
			)})
		break;
		case "text/csv":
			console.log("File type: comma separated values");
			importTSV("csv", req, res, function(collection) {
				return res.json({
					"status": "ok",
					filename:req.file.filename,
					title: req.body.title,
					nodeid: req.body.nodeid,
					project: req.body.project,
					collection: collection,
					data_description: req.body.data_description
				}
			)})
		break;
		default:
			console.log("File type: unidentified!");
			return res.json({"error":"File type unidentified!"});
	}
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


// applies a user defined function to a certain field of all records
exports.applyFuncForEach = function (node, callback) {
	var count = 0;
	
	//db.getCollectionNames(callback)
	if(typeof node.collection  === "undefined") {
		console.log("ERROR: collection not found");
		callback();
		return;
	}
	
	mongoquery.find2({}, node.collection, function (err, doc) {
		console.log("documents found:", doc.length);
		console.log(node.settings);
		async.eachSeries(doc, function iterator(doc, next) {
			var value = "";
			//console.log("old value: ",doc[node.params.field]);
			if(typeof(doc[node.params.field]) !== "undefined") {
				try {
					eval(node.func); 
				} catch (e) {
					if (e instanceof SyntaxError) {
						console.log("Syntax error in node function!");
					} else {
						console.log("Error in node function!");
					}
					callback("Error in node function!", count);
					return;
				}
				//console.log("new value: ", value);
				var setter = {};
				setter[node.params.field + node.params.suffix] = value;
				mongoquery.update(node.collection, {_id:doc._id},{$set:setter}, next);
				count++;
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


function importTSV (mode, req, res, cb) {
	
	var streamCSV = require("node-stream-csv");

	var records = [];
	streamCSV({
		filename: "uploads/" + req.file.filename,
		mode: mode,
		dontguess: true },
		function onEveryRecord (record) {
			var count = 0;
			var empty = 0;
			for(var prop in record) {

				if (record.hasOwnProperty(prop)) {
					// clean key names (remove -. and convert spaces to underscores)
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
			writeJSON2File(req.file.filename, records, function write2DB (err) {
				if (err) {
					console.error('Crap happens');
					res.json({"error": err});
				} else {
					// get project prefix for collection name and import to db
					mongoquery.findOneById(req.body.project, "projects", function(data) {
						var collection = data.prefix + req.body.title;
						importJSON(req.file.filename, collection,  res, cb);
					});
				}


			}
		)}
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
		mongoquery.save(collection, json, function() {});
		cb(collection);


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




function generateView(nodeParams, callback) {
	// read one record and extract field names
	// NOTE: this assumes that every record has all field names
	mongoquery.findOne({}, nodeParams.collection, function(data) {

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
		data = data.replace(/\[\[html\]\]/, project.nodes[index].data_view);
		callback(data);
	});
}

function createNodeView(data, nodeId, callback) {
	mongoquery.findOne({"nodes._id":mongojs.ObjectId(nodeId)}, "projects", function(project) {
		var index = indexByKeyValue(project.nodes, "_id", nodeId);
		data = data.replace(/\[\[project\]\]/, project.title);
		data = data.replace(/\[\[node\]\]/, "var node = " + JSON.stringify(project.nodes[index]));
		// insert node's html view to view.html
		data = data.replace(/\[\[html\]\]/, project.nodes[index].data_view);
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


