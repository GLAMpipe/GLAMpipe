
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

exports.run = function() {

	//console.log('NODE RUN: node:', req.params.id);
	io.sockets.emit("news", "NODE: running node " + req.params.id);

	exports.getNode(req.params.id, function(err, node) {
		if(err) {
			console.log("node not found");
			io.sockets.emit("error", "node not found");
			return;
		}
		
		node.settings = req.body;
		node.req = req;	
		// we make copy of settings that is saved to db so that we can remove certain fields (passwds etc.)
		// from it without affecting settings that are used by node
        var copy = Object.assign({}, node.settings) 
		
		// save node settings TODO: set callback
		mongoquery.editProjectNode(node._id, {"settings":copy}, function() {

			console.log("\n>>>>>>>>>>>>>> RUNNING NODE >>>>>>>>>>>>>>>>>>>>>>>>");
			console.log("title: " + node.title);
			console.log("type: ", node.type);
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
				io.sockets.emit("error", e.message);
			}
		})

	})

}

exports.getNode = function (node_id, cb) {

	mongoquery.findOne({"nodes._id":mongojs.ObjectId(node_id)}, "mp_projects", function(err, project) {
		if(!project) {
			return cb("not found", null);
		}
		var index = indexByKeyValue(project.nodes, "_id", node_id);
		var node = project.nodes[index];
		node.project = project._id;
		node.project_title = project.title;
		node.project_dir = project.dir;
		cb(null, node);	
	})
	
}



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
			
			// apply metanode's settings to settings of the first subnode
			for(var key in node.settings)
				node.pipe[0].settings[key] = node.settings[key];
			
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
							var downloader = require("../app/node_runners/download-file.js");
							var csv = require("../app/node_runners/source-file-csv.js");
							sandbox.pre_run.runInContext(sandbox); // ask url and user auth from node
							var download = sandbox.out.urls[0]; // we have only one download
							downloader.downloadAndSave (node, download, function() {
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
									sandbox.out.say("finish","login failed");
								else {
									console.log("LOGIN GOOD");
									asyncLoop.loop(node, sandbox, mv_bot.uploadFile);
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
							var checksum = require("../app/node_runners/file-checksum.js");
							asyncLoop.fieldLoop(node, sandbox, checksum.getHash);
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
