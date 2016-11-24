var mongojs 	= require('mongojs');
var async 		= require("async");
var colors 		= require('ansicolors');
var path 		= require("path");
var flatten 	= require("flat");
const vm 		= require('vm');
var mongoquery 	= require("../app/mongo-query.js");
var nodeview 	= require("../app/nodeview.js");
var sourceAPI	= require("../app/node_runners/basic_fetch.js");
var asyncLoop	= require("../app/async-loop.js");
const MP 		= require("../config/const.js");
var exports 	= module.exports = {};


exports.runNode = function (node, io) {


	// context for node scripts
	var sandbox = {
		context: {
			doc: null,
			data: null,
			vars: {},
			myvar: {},
			node: node,
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
			schema: [],
			key_type: [],
			add_display_key: function (key, type) {
				if(this.schema.indexOf(key) < 0) {
					this.schema.push(key);
					this.key_type.push(type);
				}
			},
			say: function(ch, msg) {
				console.log(ch.toUpperCase() + ":", msg);
				io.sockets.emit(ch, {"nodeid":node._id, "msg":msg});
				var date = new Date();
				mongoquery.runLog({"mode": ch, "ts": date, "node_uuid": node._id.toString(), "nodeid":node.nodeid, "settings": node.settings}, function(err, result) {
					console.log("logged");
					// send response
					if(ch === "finish" && node.res) 
						node.res.json({status:"finished", node_uuid: node._id.toString(), nodeid: node.nodeid, ts: date}) // toimii
				});
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
		console.log(node.scripts.run);
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
			if(sandbox.context.init_error) 
				return;
			
			switch (node.subtype) {
				
				case "web":

					switch (node.subsubtype) {
						
						// two phase import
						case "two_rounds" :
							sourceAPI.fetchDataInitialMode (node,sandbox, io);
						break;
						
						// **** DRAFT!!!****
						
						case "csv":
							var downloader = require("../app/node_runners/download-file.js");
							var csv = require("../app/node_runners/source-file-csv.js");
							pre_run.runInContext(sandbox); // ask url and user auth from node
							var download = sandbox.out.urls[0]; // we have only one download
							downloader.downloadAndSave (node, download, function() {
								console.log(download.response.statusCode);
								if(download.response.statusCode == 200) {
									// read data from CSV
									csv.readToArray(node, sandbox, io, function(data) {
							
										var new_records = [];
										// query update keys from db
										mongoquery.findDistinct({}, node.collection, "dt", function(err, records) {
												data.forEach(function(csv_item, j) {

													var dt = csv_item.dt;
													//dt = dt.replace(/[\r\n]/g, '');
													console.log(records.indexOf(dt));
													if(records.indexOf(dt) === -1)
														new_records.push(csv_item);
												})
											
											// new ones
											console.log("NEW: ", new_records);
											//save to database
											if(new_records.length) {
												mongoquery.insert(node.collection, new_records , function(error) {
													if(error) {
														console.log(error);
														runNodeScriptInContext("finish", node, sandbox, io);
													} else {
														runNodeScriptInContext("finish", node, sandbox, io);
													}
												})
											} else {
												runNodeScriptInContext("finish", node, sandbox, io);
											}
										})
										
									});
								} else if(download.response.statusCode == 302) {
									io.sockets.emit("error", {nodeid:node.nodeid, msg:"Import failed (server said 302)! Check your password and username and CSV url"});

								}
							});
							
							// **** DRAFT ENDS ****
							
						break;
						
						default:
							sourceAPI.fetchData(node,sandbox, io);

					}
					
				break;

				case "collection":
				
					switch (node.subsubtype) {
						
						case "group_by_key" :
						
							function groupCB (data) {
								// provide data to node
								//sandbox.context.data = data;
								
								// let node pick the data it wants from result
								//runNodeScriptInContext("run", node, sandbox, io);
								
								// add source id to data
								for (var i = 0; i < data.length; i++ ) {
									data[i][MP.source] = node._id;
								}
								// insert
								mongoquery.insert(node.collection, data, function(err, result) {
									runNodeScriptInContext("finish", node, sandbox, io);
								});
								
							}
							
							// remove previous data insertet by node and import file
							var query = {}; 
							query[MP.source] = node._id;
							mongoquery.empty(node.collection, query, function() {
								// we must check if input key is array or not
								mongoquery.findOne({}, node.params.source_collection, function (err, record) {
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
									
					}
				
				break;

				
				case "upload":
				
					switch (node.subsubtype) {
						
						case "csv":
						
							var csv = require("../app/node_runners/source-file-csv.js");
							// remove previous data insertet by node and import file
							var query = {}; 
							query[MP.source] = node._id;
							mongoquery.empty(node.collection, query, function() {
								csv.importFile(node, sandbox, io);
							});
							
						break;

					}
						
				
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
								mongoquery.insert(node.collection, sandbox.out.value, function(err, result) {
									runNodeScriptInContext("finish", node, sandbox, io);
									//generate view and do *not* wait it to complete
									//exports.updateView(node, sandbox, io, function(msg) {});
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
			sandbox.run = run;
		
			switch (node.subtype) {
				
				case "file":
				
					switch (node.subsubtype) {
						case "csv":
							require("../app/node_runners/export-file-csv.js").collectionToFile(node, sandbox, io);
							break;
							
						default:
							require("../app/node_runners/export-file.js").collectionToFile(node, sandbox, io);
							break;
					}
					
				break;
				
				case "web":
				
					switch (node.subsubtype) {
						
						case "dspace_upload":
							var dspace = require("../app/node_runners/dspace.js");
							dspace.login(node, sandbox, io, function(error) {
								if(error)
									console.log("ERROR: login failed");
								else {
									console.log("LOGIN GOOD");
									asyncLoop.loop(node, sandbox, dspace.uploadItem);
								}
							});
							
						break;
						
						case "dspace_update":
							var dspace = require("../app/node_runners/dspace.js");
							dspace.login(node, sandbox, io, function(error) {
								if(error)
									console.log("ERROR: login failed");
								else {
									console.log("LOGIN GOOD");
									asyncLoop.loop(node, sandbox, dspace.updateData);
								}
							});
						break;
					}
				
				break;
			}



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
				
			var downloader = require("../app/node_runners/download-file.js");
			asyncLoop.loop(node, sandbox, downloader.downloadFile);

		break;


		case "process":
		
			switch (node.subtype) {
				
				case "files":
				
					switch (node.subsubtype) {
						
						case "extract_references":
							var extractReferences = require("../app/node_runners/file_pdf.js");
							asyncLoop.loop(node, sandbox, extractReferences.extractReferences);
						break;
					}
					break;	

				case "fields":
				
					switch (node.subsubtype) {
						
						case "link_checker":
							var checker = require("../app/node_runners/link-checker.js");
							asyncLoop.loop(node, sandbox, checker.checkLinks);
						break;

						case "detect_language":
							var detect = require("../app/node_runners/field-detect-language.js");
							asyncLoop.loop(node, sandbox, detect.language);
						break;
					
						default:
							asyncLoop.loop(node, sandbox, function ondoc (doc, sandbox, next) {
									run.runInContext(sandbox);
									next();
								});

						}
					break;
			}				


		break;


		case "upload":
			switch (node.subtype) {
				case "data":
					switch (node.subsubtype) {
						case "dspace":
						
							var dspace = require("../app/node_runners/dspace.js");
							dspace.login(node,sandbox, io, function(error) {
								if(error)
									console.log("ERROR: login failed");
								else {
									console.log("LOGIN GOOD");
									dspace.updateData(node,sandbox, io);
								}
							});
							
							break;
					}

					break;
				
				case "file":
					switch (node.subsubtype) {
						case "mediawiki_bot":
						
							var mv_bot = require("../app/node_runners/mediawiki_bot.js");

						break;
					}
					
				break;
		}
		break;

		default:
			sandbox.out.say("finish", "This node is not runnable");
			return;
	}	

}





// try to give some sensible value
function getProp(doc, keyname, index) { 
	
	var obj = doc[keyname];
	if(obj == null)
		return "";
	
	// if array, then give value by optional index
	if (obj.constructor.name === "Array") {
		if(index != null) {
			if(obj[index])
				return obj[index];
			else
				return obj[0]
		} else {
			// if index is not given or its not found, then give the first one
			return obj[0];
		}
		
	// this is object, find dotted value (like dc.type.uri)	
	} else {
	
		var arr = keyname.split('.'); 
		while(arr.length && (obj = obj[arr.shift()])); 
		if(typeof obj === 'undefined') return ''; 
		return obj; 
	}
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
