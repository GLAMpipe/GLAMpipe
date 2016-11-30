var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path        = require('path');
var mongoquery 	= require("../../app/mongo-query.js");
var collection = require("../../app/collection.js");


var exports = module.exports = {};
console.log("inside bot");

exports.uploadFileWithWikitext = function (node, sandbox, io) {

	var bot = require('nodemw');
	var async = require("async");
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
							return next();

						} else {

							fs.readFile(sandbox.out.filename, function (err,data) {
								if (err) {
									console.log("file not found:", err);
									io.sockets.emit("error", err);
									return next();	// skip if file not found
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

