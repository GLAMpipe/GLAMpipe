var mongojs		= require('mongojs');
var async		= require("async");
var colors		= require('ansicolors');
var path 		= require("path");
var flatten 	= require("flat");
const vm 		= require('vm');
var validator 	= require('validator');
var parser		= require('xml2json');

var mongoquery	= require("../app/mongo-query.js");
var nodeview 	= require("../app/nodeview.js");
var sourceAPI	= require("../app/node_runners/basic-fetch.js");
var asyncLoop	= require("../app/async-loop.js");
const MP 		= require("../config/const.js");
const config 	= require("../config/config.js");
var exports 	= module.exports = {};



exports.runNode = function (node, io) {
	
	// create context for GP node
	var sandbox = exports.createSandbox(node ,io);
	// init node scripts
	var init 	= CreateScriptVM(node, sandbox, "init");
	sandbox.pre_run = CreateScriptVM(node, sandbox, "pre_run");
	sandbox.run 	= CreateScriptVM(node, sandbox, "run");
	sandbox.finish 	= CreateScriptVM(node, sandbox, "finish");
	
	init.runInContext(sandbox);
	
	// we quit in init_error
	if(sandbox.out.init_error) {
		console.log("*********** NODE INIT ERROR ***********************");
		console.log("msg: " + sandbox.out.init_error);
		io.sockets.emit("error", {"nodeid":node._id, "msg": sandbox.out.init_error});
		return;
	}

	// node run "router"
	switch (node.type) {


/***************************************************************************************************************
 *                                       METANODE                                                                *
 * *************************************************************************************************************/


		case "meta":
			
			//runNodeScriptInContext("init", node, sandbox, io);
			if(sandbox.context.init_error) 
				return;

runNodeScript("metanodes", node, null, null);  // sets "node.pipe"

			// apply metanode's settings to settings of the first subnode
			for(var key in node.settings)
				node.pipe[0].settings[key] = node.settings[key];
			
			// dynamic settings
			node.pipe.forEach(function(pipe, index) {
				console.log(pipe.nodeid)
				//console.log(pipe.params)
				//console.log(pipe.settings)
				//console.log(pipe.settingsFunc())
				if(pipe.settingsFunc) {
					console.log("settingsFunc");
					console.log(pipe.settingsFunc());
					//pipe.settings = pipe.settingsFunc();
				}
			})
			
			metanode = require("../app/node_runners/metanode.js")
			asyncLoop.loop(node, sandbox, metanode.run);
				
			break;


//var request = Promise.promisifyAll(require("request"), {multiArgs: true});
 
//var urlList = ["https://commons.wikimedia.org/wiki/Commons_talk:Structured_data#It.27s_alive.21", "https://commons.wikimedia.org/wiki/User:Basvb/Ideas/Single_Image_Batch_Upload", "hthtps://yle.fi/uutiset"];
//Promise.mapSeries(urlList, function(url) {
	//return request.getAsync(url).then(function(response,body) {
		//console.log(url)
		//return url;
	//});
//}).then(function(results) {
	 //// results is an array of all the parsed bodies in order
	 //console.log("then")
	 //console.log(results)
//}).catch(function(err) {
	 //// handle error here
	 //console.log(err.message)
	 //sandbox.run.runInContext(sandbox);
//});






/***************************************************************************************************************
 *                                       SOURCE                                                                *
 * *************************************************************************************************************/

		case "source":
			//runNodeScriptInContext("init", node, sandbox, io);
			if(sandbox.context.init_error) 
				return;
			
			switch (node.subtype) {
				
				case "web":

					switch (node.subsubtype) {
						
						// two phase import
						case "two_rounds" :
							sourceAPI.fetchDataInitialMode (node,sandbox, io);
						break;

						case "eprints" :
							// we first get all item ids (is there a better way?)
							var w = require("../app/node_runners/web.js");
							var url = node.params.eprints_url + "/eprint/";
                            url = url.replace("//eprint", "/eprint");
							var options = {url: url}
							w.fetchContent(options, sandbox, function() {
								sandbox.pre_run.runInContext(sandbox);
								asyncLoop.importLoop(node, sandbox, w.fetchContent);
							})
						break;

						case "csv":
							var web = require("../app/node_runners/web.js");
							var csv = require("../app/node_runners/source-file-csv.js");
							sandbox.pre_run.runInContext(sandbox); // ask url and user auth from node
							var download = sandbox.out.urls[0]; // we have only one download
							web.downloadAndSave (node, download, function() {
								csv.importUpdates(node, sandbox, download, io);
							});
						break;
						
						default:
							sourceAPI.fetchData(node,sandbox, io);

					}
					
				break;

				case "collection":
				
					switch (node.subsubtype) {
						
						case "group_by_key" :
						
							function groupCB (data) {
								
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
									if(!err && record) {
										//var array = record[node.params.in_field].constructor.name == "Array";
										mongoquery.group(node, true, groupCB);
									} else {
										io.sockets.emit("error", {"nodeid":node._id, "msg":"Record or field not found!"});
										io.sockets.emit("progress", {"nodeid":node._id, "msg":"Destroy node and create new one with correct field name."});
									}
								}) 
							});
						break;
						
						case "grobid":
							var web = require("../app/node_runners/web-get-content.js");
							asyncLoop.sourceLoop(node, sandbox, web.uploadFile);
						break;	

						case "select":
							asyncLoop.sourceLoop(node, sandbox, function ondoc (doc, sandbox, next) {
								sandbox.run.runInContext(sandbox);
								next();
							});
						break;	
						
						default:
							io.sockets.emit("finish", {"nodeid":node._id, "msg":"There is no run-switch for this node yet!"});
							console.log("There is no run-switch for this node yet!");
								
					}
				
				break;

				
				case "file":
				
					switch (node.subsubtype) {
						
						case "csv":
						
							var csv = require("../app/node_runners/source-file-csv.js");
							var query = {}; 
							query[MP.source] = node._id;
							// remove previous data inserted by node and import file
							mongoquery.empty(node.collection, query, function() {
								csv.importFile_stream(node, sandbox, io);
							});
							
						break;

						case "pdf":
						
							var pdf = require("../app/node_runners/file-pdf.js");
							var query = {}; 
							query[MP.source] = node._id;
							console.log(query);
							// remove previous data inserted by node and import file
							mongoquery.empty(node.collection, query, function() {
								pdf.extractText(node, sandbox, io);
							});
							
						break;

					}
						
				
				break;


				case "directory":
				
					var dir = require("../app/node_runners/source-directory.js");
					dir.read(node, sandbox, io);
				
				break;
			}

		break;

/***************************************************************************************************************
 *                                       EXPORT                                                                *
 * *************************************************************************************************************/
		
		case "export":
		
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
		
						case "omeka_additem":
							var web = require("../app/node_runners/web.js");
							asyncLoop.loop(node, sandbox, web.postJSON);
						break;
										
						case "dspace_additem":
							var dspace = require("../app/node_runners/dspace.js");
							dspace.login(node, sandbox, io, function(error) {
								if(error)
									sandbox.out.say("error","login failed");
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
									sandbox.out.say("error","login failed");
								else {
									console.log("LOGIN GOOD");
									asyncLoop.loop(node, sandbox, dspace.updateData);
								}
							});
						break;

						case "dspace_addfield":
							var dspace = require("../app/node_runners/dspace.js");
							dspace.login(node, sandbox, io, function(error) {
								if(error)
									sandbox.out.say("error","login failed");
								else {
									console.log("LOGIN GOOD");
									asyncLoop.loop(node, sandbox, dspace.addMetadataField);
								}
							});
						break;


						case "dspace_addfile":
							var dspace = require("../app/node_runners/dspace.js");
							dspace.login(node, sandbox, io, function(error) {
								if(error)
									sandbox.out.say("error","login failed");
								else {
									console.log("LOGIN GOOD");
									asyncLoop.loop(node, sandbox, dspace.addFile);
								}
							});
						break;
						
						case "mediawiki_bot":
							var mv_bot = require("../app/node_runners/mediawiki-bot.js");
							mv_bot.login(node, sandbox, io, function(error) {
								if(error)
									sandbox.out.say("error","login failed");
								else {
									console.log("LOGIN GOOD");
									asyncLoop.fieldLoop(node, sandbox, mv_bot.uploadFile);
								}
							});
						break;

						case "upload_file":
							var web = require("../app/node_runners/web.js");
							asyncLoop.fieldLoop(node, sandbox, web.uploadFile);
						break;

						default:
							io.sockets.emit("finish", {"nodeid":node._id, "msg":"There is no run-switch for this node yet!"});
							console.log("There is no run-switch for this node yet!");
					
					}
				
				break;
			}

		break;


/***************************************************************************************************************
 *                                       PROCESS                                                               *
 * *************************************************************************************************************/
		case "process":
		
			switch (node.subtype) {
				
				case "files":
				
					switch (node.subsubtype) {

						case "pdf2image":
							var pdf = require("../app/node_runners/file-pdf.js");
							asyncLoop.fieldLoop(node, sandbox, pdf.pdf2image);
						break;

						case "calculate_checksum":
							var file = require("../app/node_runners/file.js");
							asyncLoop.fieldLoop(node, sandbox, file.getHash);
						break;

						case "type":
							var file = require("../app/node_runners/file.js");
							asyncLoop.fieldLoop(node, sandbox, file.getType);
						break;

						case "grobid":
							var web = require("../app/node_runners/web-get-content.js");
							asyncLoop.loop(node, sandbox, web.uploadFile);
						break;
						
						default:
							io.sockets.emit("finish", {"nodeid":node._id, "msg":"There is no run-switch for this node yet!"});
							console.log("There is no run-switch for this node yet!");
					}
					break;	


				case "strings":
				
					switch (node.subsubtype) {

						case "detect_language":
							var detect = require("../app/node_runners/field-detect-language.js");
							asyncLoop.loop(node, sandbox, detect.language);
						break;
					
						default: // syncronous nodes
							asyncLoop.loop(node, sandbox, function ondoc (doc, sandbox, next) {
								sandbox.run.runInContext(sandbox);
								next();
							});
						}
					break;
					
				case "documents":
				
					switch (node.subsubtype) {
						
						case "select_delete":
							asyncLoop.deleteLoop(node, sandbox, function ondoc (doc, sandbox, next) {
								sandbox.run.runInContext(sandbox);
								next();
							});	
						break;
					}
					break;
					
				case "lookups":
				
					switch (node.subsubtype) {
						
						case "collection":
							// read map data
							mongoquery.find({}, sandbox.context.node.params.source_collection, function(err, result) {
								sandbox.context.data = result;
								console.log(result);
								asyncLoop.loop(node, sandbox, function ondoc (doc, sandbox, next) {
									sandbox.run.runInContext(sandbox);
									next();
								});
							})

						break;	

						case "web":
							var web = require("../app/node_runners/web.js");
							asyncLoop.fieldLoop(node, sandbox, web.fetchJSON);
						break;

						case "web_check":
							var web = require("../app/node_runners/web.js");
							asyncLoop.fieldLoop(node, sandbox, web.headRequest);
						break;

						default:
							asyncLoop.loop(node, sandbox, function ondoc (doc, sandbox, next) {
								sandbox.run.runInContext(sandbox);
								next();
							});			

					}
					
				case "downloads":
				
					switch (node.subsubtype) {
						case "basic":
							var web = require("../app/node_runners/web.js");
							if(config.isServerInstallation && !node.res) {
								io.sockets.emit("finish", {"nodeid":node._id, "msg": "Download nodes not available on server installation"});
							} else {
								asyncLoop.fieldLoop(node, sandbox, web.downloadFile);
							}
						break;
					}
					
					break;
			}				


		break;





/***************************************************************************************************************
 *                                       VIEW                                                              *
 * *************************************************************************************************************/

		case "view":
			switch (node.subtype) {
				case "facet":
					var facet = require("../app/node_runners/view-facet.js");
					facet.writeConfig(node, sandbox);
				break;
			}


		break;


		default:
			sandbox.out.say("finish", "This node is not runnable");
			return;
	}	

}



exports.createSandbox = function (node, io) {

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
			validator: validator,
			parser: parser,
			MP: MP
		},
		out: {
			self:this,
			error_marker: "AAAA_error:",
			pre_value:"",
			value:"",
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
				var log = {"mode": ch, "ts": date, "nodeid":node.nodeid, "msg": msg};
				if(global.register[node.req.originalUrl])
					global.register[node.req.originalUrl].log.push(log);
				
				// send http response if needed (i.e. node was executed by "run" instead of "start")
				if(ch === "finish" && node.res) {
					console.log(sandbox.out.value);
					if(this.error)
						node.res.json({status:"error", node_uuid: node._id.toString(), nodeid: node.nodeid, ts: date, msg:msg}) // toimii
					else
						node.res.json({
							status:"finished", 
							node_uuid: node._id.toString(), 
							nodeid: node.nodeid, 
							ts: date, 
							result:{
								value:sandbox.out.value,
								setter:sandbox.out.setter
								}
							}) 
				} else if(ch === "error" && node.res) {
					node.res.json({status:"error", node_uuid: node._id.toString(), nodeid: node.nodeid, ts: date, msg: msg}) 
				}
				
				// remove node from register if finished or if error (aborting)
				if(ch === "finish" || ch === "error") {
					console.log("REGISTER: deleting " + node.req.originalUrl)
					delete global.register[node.req.originalUrl];

				}
			}
		},
		say: io.sockets.emit
	};
	
	return vm.createContext(sandbox);

}

function sendRunResponse(no) {
	console.log("out" + JSON.stringify(no.sandbox));
}

// currently not used
function CreateScriptVM(node, sandbox, scriptName) {
		
	// create scripts (this will catch syntax errors)
	try {
		var run = new vm.createScript(node.scripts[scriptName]);
	} catch (e) {
		console.log("ERROR:", e.stack);
		console.log(node.scripts[scriptName]);
		sandbox.out.say("error", "Error in node: 'run' script: " + e.name +" " + e.message);
		sandbox.out.say("error", "Slap the node writer!");
	}
	return run;
	

}

// try to give some sensible value
function getProp(doc, keyname, index) { 

	var obj = doc[keyname];
	if(obj == null)
		return "";

	// if string, then return that
	if (typeof obj === "string")
		return obj;

	
	// if array, then give value by optional index
	if (Array.isArray(obj)) {
		if(index) {
			if(obj[index])
				return obj[index];
			else
				return ""; // if index is not found, return empty string
		} else {
			// if index is not given, then give the first one
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
