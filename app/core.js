var mongojs 	= require('mongojs');
var async 		= require("async");
var colors 		= require('ansicolors');
var path 		= require("path");
var flatten 	= require("flat");
const vm 		= require('vm');
var mongoquery 	= require("../app/mongo-query.js");
var nodeview 	= require("../app/nodeview.js");
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
			mongoquery.insert("mp_settings", {"project_count":0, "data_path":""}, function(result) {
				if(result.error)
					console.log("ERROR: could not create project counter!");
				else 
					callback();
			});
		}
	});
}

exports.initDir = function (callback) {
	fs = require('fs');
	var dataPath = "";

	mongoquery.findOne({},"mp_settings", function(data) { 
		if(data.data_path == "") {
			callback(null);
		} else {
			// if we are not running on OPENSHIFT
			if (typeof process.env.OPENSHIFT_DATA_DIR === "undefined") {
				// then use datapath from "mp_settings" collection
				dataPath = data.data_path;
			// else use OPENSHIFT data dir
			} else 
				dataPath = process.env.OPENSHIFT_DATA_DIR;
				
			// create "projects" directory
			fs.mkdir(path.join(dataPath, "projects"), function(err) {
				if(err) {
					if(err.code === "EEXIST") {
						console.log("INIT: projects directory exists");
						callback(dataPath);
					} else
						console.log("ERROR:", err);
					return;
				}
				console.log("INIT: output directory created");
				callback(dataPath);
			});
			
		}
	});

}


/**
 * load stock nodes
 * - reads .json files from "nodes" directory
 * - combines with descriptions from "node_type_descriptions.json"
 * - inserts nodes to "mp_nodes" collection
 */

exports.initNodes = function (io, callback) {

    var dataPath = global.config.dataPath;
        
    mongoquery.drop("mp_nodes", function() {

        fs = require('fs');
        // read first node type descriptions
        fs.readFile(path.join(dataPath, "nodes", "config", "node_type_descriptions.json"), 'utf8', function (err, data) {
            if(err) {
                console.log("NOTICE: node type descriptions not found from " + dataPath);
                desc = {};
            } else 
                var desc = JSON.parse(data);

            // read local nodes first
           // console.log("INIT: Loading YOUR OWN nodes from " + path.join(dataPath, "mynodes/"));
            //exports.readNodes(io, path.join(dataPath, "mynodes/"), desc, function (error) {
                // then "stock" nodes
                console.log("INIT: Loading stock nodes from " + path.join(dataPath, "nodes/") );
                exports.readNodes(io, path.join(dataPath, "nodes/"), desc, function (error) {
                    callback(null);     
                });        
            //});
        });
    });
}





exports.readNodes = function (io, nodePath, descriptions, callback) {
        
    readFiles(nodePath, function(filename, content, next) {
        
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
                    console.log("LOAD: " + filename + " loaded");
                    io.sockets.emit("progress", "LOAD: " + filename + " loaded");
                    next();
                }
            })
            
        } catch(e) {
            console.log(colors.red("ERROR: JSON is malformed in %s"), filename);
            io.sockets.emit("error", "ERROR: JSON is malformed in " + filename);
            next(); // continue anyway
        }

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



exports.downloadNodes = function (io, cb) {

    var dataPath = global.config.dataPath;
    var sandbox = { 
        out: {
            url:"https://github.com/artturimatias/metapipe-nodes/archive/master.zip",
            file:"master.zip"
        },
        context:{}
    };
                
    var node = {dir:dataPath};
    
    // download nodes
    console.log("DOWNLOADING: nodes from github");
    io.sockets.emit("progress", "DOWNLOADING: nodes from github");
    console.log(sandbox.out.url);
    exports.downloadFile(node, sandbox, function (err) {
        if(err.context.error) {
            console.log(err.context.error);
            io.sockets.emit("error", err.context.error);
            cb(err.context.error);
            
        } else {
            const Zip = require("adm-zip");
            var zip = new Zip(path.join(dataPath, "master.zip"));
            console.log("EXTRACTING: master.zip");
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


exports.deleteProject = function (doc_id, res) {
	
	mongoquery.remove(doc_id, "mp_projects", function(data) {
        console.log("PROJECT: deleting project:", doc_id);
        res.json(data);
    });
    

}

exports.getProjectTitles = function  (res) {
	mongoquery.findFields({}, {title:true}, "mp_projects", function(err, data) { 
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
                    console.log("FILE:", nodePath);
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


function getProp(obj, desc) { 
	var arr = desc.split('.'); 
	while(arr.length && (obj = obj[arr.shift()])); 
	if(typeof obj === 'undefined') return ''; 
	return obj; 
}

/**
 * run project node based on node type
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
            node.project_dir = project.dir;

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
                    myvar: {},
					node: node,
					input_node: input_node,
					doc_count:0,
					count:0,
					path: path,
					get: getProp,
                    flat: flatten,
					MP: MP
				},
				out: {
					pre_value:"",
					value:"",
					url: "",
					file:"",
					setter:null,
					updatequery: null,
					error: null,
					console:console,
					say: function(ch, msg) {
						console.log(ch.toUpperCase() + ":", msg);
						io.sockets.emit(ch, {"nodeid":node._id, "msg":msg});
					}
				},
				say: io.sockets.emit
			};
			
			var sand = vm.createContext(sandbox);
            
            // create scripts (this will catch syntax errors)
            try {
                var run = new vm.createScript(node.scripts.run);
            } catch (e) {
                console.log("ERROR:", e.stack);
                sandbox.out.say("error", "Error in node: 'run' script: " + e.name +" " + e.message);
                sandbox.out.say("error", "Slap the node writer!");
                return;
            }
            
            try {
                var pre_run = new vm.createScript(node.scripts.pre_run);
            } catch (e) {
                console.log("ERROR:", e.stack);
                sandbox.out.say("error", "Error in node: 'pre_run' script: " + e.name +" " + e.message);
                return;
            }
			switch (node.type) {


				case "source":
				
					runNodeScriptInContext("init", node, sandbox, io);
                    if(sandbox.context.init_error) return;
					
					switch (node.subtype) {
						
						case "API":
						
							function requestLoop(){
								async.series([
									function (callback) {

										exports.callAPI(sandbox.out.url, function(error, response, body) {
											sandbox.context.error = error;
											sandbox.context.response = response;
											sandbox.context.data = body;
											sandbox.out.url = "";
											runNodeScriptInContext("run", node, sandbox, io);
                                            
                                            if(sandbox.context.node_error) 
                                                return callback(sandbox.context.node_error, null);
                                            
											
											// add source id to data (expects out.value to be an array)
                                            if(sandbox.out.value != null) {
                                                for (var i = 0; i < sandbox.out.value.length; i++ ) {
                                                    // flatten
                                                    //sandbox.out.value[i] = flatten(sandbox.out.value[i], {delimiter:"__"});
                                                    sandbox.out.value[i][MP.source] = node._id;
                                                }
                                            
                                                
                                                // insert data
                                                mongoquery.insert(node.collection, sandbox.out.value, function() {
                                                    callback(null, sandbox.out.url);
                                                });
                                            }
										});
									}

								], function(err, result){
									if (err) {
										console.log(err);
                                        return;
                                    }
										
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
							// remove previous data insertet by node and import file
							var query = {}; 
							query[MP.source] = node._id;
							mongoquery.empty(node.collection, query, function() {
								requestLoop();
							});
							
							
						break;

						case "group":
						
							function groupCB (data) {
								// provide data to node
								//sandbox.context.data = data;
								
								// let node pick the data it wants from result
								//runNodeScriptInContext("run", node, sandbox, io);
								
								// add source id to data
								for (var i = 0; i < data.length; i++ ) {
									// flatten
									data[i][MP.source] = node._id;
								}
								// insert
								mongoquery.insert(node.collection, data, function() {
									runNodeScriptInContext("finish", node, sandbox, io);
									//generate view and do *not* wait it to complete
									//exports.updateView(node, sandbox, io, function(msg) {});
								});
								
							}
							
							// remove previous data insertet by node and import file
							var query = {}; 
							query[MP.source] = node._id;
							mongoquery.empty(node.collection, query, function() {
                                // we must check if input key is array or not
                                mongoquery.findOne({}, node.params.source_collection, function (record) {
                                    if(record) {
                                        if(record[node.params.in_field]) {
                                            var array = record[node.params.in_field].constructor.name == "Array";
                                            mongoquery.group(node, array, groupCB);
                                        } else {
                                            io.sockets.emit("error", {"nodeid":node._id, "msg":"Field not found!"});
                                            io.sockets.emit("progress", {"nodeid":node._id, "msg":"Destroy node and create new one with correct field name."});
                                        }
                                    }
                                }) 
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
								});
								
							}
							
							// remove previous data insertet by node and import file
							var query = {}; 
							query[MP.source] = node._id;
							mongoquery.empty(node.collection, query, function() {
								exports.importFile(node, fileImport);
							});
								
						
						break;


						case "directory":
						
							var recursive = require('recursive-readdir');
							
							function scan (ignore) { 
								recursive(node.params.root, [ignore], function (err, files) {
									if(err) {
										if(err.code == "ENOENT") {
											console.log("ERROR: directory not found", node.params.root);
											io.sockets.emit("error", "directory not found: " + node.params.root);
										} else
											console.log(err);
										return;
									} 
									
									// compose file data
									sandbox.context.data = files;
									run.runInContext(sand);
									
									// insert
									if(sandbox.out.value.length > 0) {
										mongoquery.insert(node.collection, sandbox.out.value, function() {
											runNodeScriptInContext("finish", node, sandbox, io);
											//generate view and do *not* wait it to complete
											exports.updateView(node, sandbox, io, function(msg) {});
											console.log("DONE");
										});
									} else {
										console.log("None found");
									}
								});
							}
							// remove previous data insertet by node and import file
							var query = {}; 
							query[MP.source] = node._id;
							
							mongoquery.empty(node.collection, query, function() {
								var exts = node.params.include_ext.toLowerCase();
								exts = exts.replace(/[\s\.]/g, ""); 
								
								if(exts != "") {
									var ext_arr = exts.split(",");
									
									// ignore function if wanted extensions are provided
									var ignore = function (file, stats) {
										var base_split = path.basename(file).split(".");
										var ext = base_split[base_split.length-1].toLowerCase();
										if (ext_arr.indexOf(ext) === -1 && stats.isFile())
											return true;
										else 
											return false;
									}
									
									scan(ignore);
									
								} else {
									
									// ignore function that does not ignore anyone
									var ignore = function (file, stats) {
										return false;
									}
									
									scan(ignore);
								}
							});
						break;
					}

				break;


				
				case "export":

					// make sure that we have an export filename
					if(node.params.file == "") {
						console.log("ERROR: filename missing!");
                        io.sockets.emit("error", {"nodeid":node._id, "msg":"ERROR: filename missing! Re-create node and give file name."});
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
						sandbox.context.doc_eka = doc[0];
						runNodeScriptInContext("init", node, sandbox, io);
						wstream.write(sandbox.out.value);

						async.eachSeries(doc, function iterator(doc, next) {
							sandbox.context.doc = doc;
							sandbox.context.count++;
							sandbox.out.value = null;
							run.runInContext(sand);
							//runNodeScriptInContext("run", node, sandbox, io);
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

					var runFunc = null;
					
					switch (node.subtype) {
						
						case "API":
							runFunc = function(sandbox, node, onNodeScript, onError) {
								callAPISerial (sandbox, node, onNodeScript, onError);
							}
						break;
						
						case "file":
							runFunc = function(sandbox, node, onNodeScript, onError) {
								fileStats (sandbox, node, onNodeScript, onError);
							}
						break;
						
						case "collection":
                            // we must clear previous lookup
                           // mongoquery.removeKey(node.params.collection, node.params.out_field, function(error) {
                                runFunc = function(sandbox, node, onNodeScript, onError) {
                                    mongoquery.collectionLookup (sandbox, node, onNodeScript, onError);
                                }
                            //});

						break;
					}
					
					
					var onError = function(err) {
						console.log(err);
						return;
					}
					// find everything
					mongoquery.find2({}, node.collection, function (err, doc) {
						
						sandbox.context.doc_count = doc.length;
                        runNodeScriptInContext("init", node, sandbox, io);
                        if(sandbox.context.init_error) return;
						
						async.eachSeries(doc, function iterator(doc, next) {
							
							sandbox.context.doc = doc;
							sandbox.context.count++;
							
							// get URL/filename from node
							runNodeScriptInContext("pre_run", node, sandbox, io);
							if (sandbox.context.node_error) 
                                return;
							
							// callback for updating record
							var onNodeScript = function (sandbox) {

								sandbox.out.updatequery = null;
								sandbox.out.setter = null;
								// let node pick the data it wants from result
								run.runInContext(sand);
                                
                                //if(sandbox.context.node_error)
                                    //return;
								
								if(sandbox.out.setter != null) {
									var setter = sandbox.out.setter; 
								} else {
									var setter = {};
									setter[node.out_field] = sandbox.out.value;
								}
								
                                console.log(setter);
                                
								if(sandbox.out.updatequery != null)
									var updatequery = sandbox.out.updatequery;
								else
									var updatequery = {_id:sandbox.context.doc._id};
                                    
								//setter = flatten(setter, {delimiter:"__"});
                                
                                // if node set the direct update, then use that
								if(sandbox.out.mongoDBupdate) // TODO remove key
                                    mongoquery.update(node.params.collection, updatequery ,setter, next);
								else
                                    mongoquery.update(node.collection, updatequery ,{$set:setter}, next);
                                  
							}

							runFunc (sandbox, node, onNodeScript, onError);

						}, function done() {
							runNodeScriptInContext("finish", node, sandbox, io);
						});
						
					}); 
					
				break;



				case "download":
						
                    // find everything
                    mongoquery.find2({}, node.collection, function(err, doc) {
                        sandbox.context.doc_count = doc.length;
                        runNodeScriptInContext("init", node, sandbox, io);
                        
                        // run node once per record
                        async.eachSeries(doc, function iterator(doc, next) {
                            
                            sandbox.context.doc = doc;
                            sandbox.context.count++;
                            sandbox.out.url = null;
                            sandbox.context.error = null;
                            
                            // ask url and file name from node
                            runNodeScriptInContext("pre_run", node, sandbox, io);
                            exports.downloadFile(node, sandbox, function(sandbox) {
                                run.runInContext(sand);
                                // write file location to db
                                var setter = {};
                                setter[node.out_field] = sandbox.out.value;
                                console.log(setter);
                                mongoquery.update(node.collection, {_id:sandbox.context.doc._id},{$set:setter}, next);
                            })
                            
                        }, function done() {
                            runNodeScriptInContext("finish", node, sandbox, io);
                        });
                    });

				break;


				case "transform":
					
					// find everything
					mongoquery.find2({}, node.collection, function(err, docs) {
						sandbox.context.doc_count = docs.length;
						console.log(docs.length);
						runNodeScriptInContext("init", node, sandbox, io);
						
						// run node once per record
						async.eachSeries(docs, function iterator(doc, next) {

							sandbox.context.doc = doc;
							sandbox.context.count++;
							sandbox.out.value = null;  // reset output
							run.runInContext(sand);
							var setter = {};
							setter[node.out_field] = sandbox.out.value;
							//console.log(setter);
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
										sandbox.context.data = null;
										sandbox.context.error = null;
										sandbox.context.skip = null;
										
										runNodeScriptInContext("pre_run", node, sandbox, io);
										if(sandbox.context.skip) {
											next();
										} else {
											
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
														client.upload(sandbox.out.title, data, "uploaded with GLAMpipe via nodemw", function (err, data) {
															if(err) {
																io.sockets.emit("error", err);
																var setter = {};
																setter[node.out_field] = err;
																mongoquery.update(node.collection, {_id:sandbox.context.doc._id},{$set:setter}, next);
															} else {
																//console.log(data);
																
																// upload wikitext
																var content = sandbox.out.wikitext;
																console.log("STARTING TO EDIT", sandbox.out.title);
																console.log("******REAL URL", data.imageinfo.canonicaltitle);
																client.edit(data.imageinfo.canonicaltitle, content, 'test', function(err) {
																	sandbox.context.error = err;
																	sandbox.context.data = data;
																	runNodeScriptInContext("run", node, sandbox, io);
																	// write commons page url to db
																	var setter = {};
																	setter[node.out_field] = data.imageinfo.descriptionurl;
																	mongoquery.update(node.collection, {_id:sandbox.context.doc._id},{$set:setter}, function() {
																		if(sandbox.context.abort)
																			next(true);
																		else
																			next();
																	});
																});
															}
														});
													});
												}
												
											});
									}
										
										
									}, function done () {
										runNodeScriptInContext("finish", node, sandbox, io);
									});
								});
							});

						break;
						
					}
				break;


				default:
                    sandbox.out.say("finish", "This node is not runnable");
                    return;
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

	if(node.views.data_static != null) {
		mongoquery.editProjectNode(node._id, {"views.data":node.views.data_static}, function() {
			return callback("using static");
		})
		
	} else if (node.scripts.view != null) {
		runNodeScriptInContext("view", node, sandbox, io);
		mongoquery.editProjectNode(node._id, {"views.data":sandbox.out.view}, function() {
			return callback("using view created by the node");
		})
		 
	
	} else {
		return callback("using dynamic");
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
			node.dirsuffix = ""; // node can set this in "hello" script
			
			if(nodeRequest.params)
				node.params = nodeRequest.params;
			else
				node.params = {};
				
			if(node.params.out_field)
				node.out_field = node.params.out_field;
				
			node.params.collection = nodeRequest.collection;
			
			// copy static data view to project node's view if defined
			if(typeof node.views.data_static !== "undefined")
				node.views.data = node.views.data_static;
			
			runNodeScript("hello", node, nodeRequest, io);
			
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
								res.json({"status": "node created"})
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
                                res.json({"status": "node created"});
                            })  
                        } else {
                            res.json({"status": "node created"});
                        } 
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
					} else {
						console.log("node created");
						res.json({"status": "node created"})
					}

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
exports.getCollection = function (req, query, res) {

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
		collection: req.params.id,
		query: query,
		limit: limit,
		skip: skip,
		sort: req.query.sort,
		reverse: reverse
	}
	mongoquery.findAll(params, function(data) { res.json(data) });
}

exports.getCollectionByField = function (req, res) {

	var query = {};
	query[req.query.field] = req.query.value;
	
	exports.getCollection (req, query, res);
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


exports.getCollectionCount = function (collection_id, cb) {
	//var collection = db.collection(collection_id);
	//collection.count(function(err, docs) {console.log("COUNT:", docs)});
	mongoquery.countDocs(collection_id, {}, function (result) {
		cb(result);
	});
}


exports.editCollection = function (collection_id, req, callback) {

	console.log("editing", collection_id);
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
	fs.readFile("./app/views/view.html", 'utf8', function (err,data) {
		if (err) {
			return console.log(err);
		}
		nodeview.createNodeView(data, req, false, function (html) {
			cb(html);
		});

	});
}


exports.nodeEditView = function  (req, cb) {
	fs = require('fs')
	fs.readFile("./app/views/edit.html", 'utf8', function (err,data) {
		if (err) {
			return console.log(err);
		}
		nodeview.createNodeView(data, req, true, function (html) {
			cb(html);
		});

	});
}


exports.nodeFileView = function  (req, cb) {
	fs = require('fs')
	fs.readFile("./app/views/" + req.query.view, 'utf8', function (err,data) {
		if (err) {
			return console.log(err);
		}
		nodeview.createNodeView(data, req, false, function (html) {
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
		nodeview.createCollectionView(data, collectionName, function (html) {
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

    if (typeof url === "undefined" || url == "")
        callback("URL not set", null, null);

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
		if (!error && response.statusCode == 200) {
			//console.log(body); 
			callback(null, response, body);
		} else {
			console.log(error);
			callback(error, response, body);
			return;
		}
	});
}


// *********************************************************************
// ******************************* APPLY ******************************
// *********************************************************************




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

	if (typeof sandbox.out.url === "undefined") {
        sandbox.context.error = "URL missing";
		return cb(sandbox);
	} 
	if(sandbox.out.url == null || sandbox.out.url == "") {
		sandbox.context.error = "URL missing";
		return cb(sandbox);
	} 

	
	var filePath = path.join(node.dir, sandbox.out.file); 
	var file = fs.createWriteStream(filePath);
	var sendReq = request.get(sandbox.out.url);

	// verify response code
	sendReq.on('response', function(response) {
        if(response.statusCode === 200) {
            sandbox.context.response = response;
            sendReq.pipe(file);

            file.on('finish', function() {
                file.close(function () {
                    cb(sandbox);
                }); 
            });

            file.on('error', function(err) { 
                fs.unlink(filePath); // Delete the file async. 
                console.log(err);
                sandbox.context.error = err;

                if (cb) {
                    return cb(sandbox);
                }
            });
            
        } else {
           sandbox.context.error = "file not found on server!";
           return cb(sandbox);
        }

	});

	// check for request errors
	sendReq.on('error', function (err) {
		fs.unlink(filePath);
		console.log(err);
		sandbox.context.error = err;
        return cb(sandbox);

	});



}

function insertNodeActionField (collection, doc_id, field, value) {
	
}

function importXML(file) {
	
}


function importTSV (mode, node, cb) {
	
	var streamCSV = require("node-stream-csv");

	var records = [];
	var file = path.join(global.config.dataPath, "tmp", node.params.filename);
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
            //fs.stat(filename, function(err, stat) {
                // skip directories
                if (filename == "config" || filename == "data") { 
                    next();
                } else {
                    fs.readFile(dirname + filename, 'utf-8', function(err, content) {
                        if (err) {
                            onError(err);
                            return;
                        }
                        onFileContent(filename, content, next);
                    });
                }
           // })
		}, function done() {
			onDone();
		});

	});
}


/**
 * Make HTTP request in the record context
 */ 
function callAPISerial (sandbox, node, onScript, onError) {

	var request = require("request");

	 var options = {
		url: sandbox.out.url,
		method: 'GET',
		json: true
	};

	// make actual HTTP request
	request(options, function (error, response, body) {
			sandbox.context.error = error;
			sandbox.context.response = response;
			sandbox.context.data = body;
			onScript(sandbox)
	});

}


function fileStats (sandbox, node, onScript, onError) {
	fs.stat(sandbox.out.pre_value, function (err, stats) {
		if(err)
			onError(err);
			
		sandbox.context.filestats = stats;
		onScript(sandbox);
	});
}
