var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path        = require('path');
var mongoquery 	= require("../../app/mongo-query.js");
var collection = require("../../app/collection.js");


var exports = module.exports = {};

exports.login = function (node, sandbox, io, cb) {

	var bot = require('nodemw');
	var async = require("async");
	fs = require('fs');

	// ask bot config (username, pass etc.) from node
	runNodeScriptInContext("login", node, sandbox, io);
	if(sandbox.context.abort) // check for empty username or password
		return cb("login failed");
		
	var client = new bot(sandbox.out.botconfig);

	client.logIn(sandbox.out.botconfig.username, sandbox.out.botconfig.password, function (err, data) {
		
		if(err) {
			io.sockets.emit("error", "Login failed!");
			cb(err);
		} else {
            sandbox.client = client;
            cb(null);
        }
    })
}


exports.uploadFile = function (options, sandbox, next) {
	
    if(sandbox.context.skip) {
        sandbox.context.data = {pageexists: options.title};
        return next();
    } else {
		// get revisions (to see if page exists)
		sandbox.client.getArticle('File:' +options.title, function (err, d) {
			if(d != null) {
				console.log("PAGE EXISTS: " + options.title);
				// if page exists, then we pass the url to run.js 
				sandbox.context.data = {pageexists: options.title};
				return next();
				
			// read file
			} else {
				fs.readFile(options.filename, function (err,data) {
					if (err) {
						io.sockets.emit("error", err);
						sandbox.context.error = err;
						return next();	// skip if file not found
					} 
					
					// upload file
					sandbox.client.upload(options.title, data, "uploaded with GLAMpipe via nodemw", function (err, data) {
						sandbox.context.data = data;
						if(err) {
							io.sockets.emit("error", err);
						} else {
							// upload wikitext
							sandbox.client.edit(data.imageinfo.canonicaltitle, options.wikitext, 'initial metadata', function(err) {
								sandbox.context.error = err;
								next();
							});
						}
					});
				
				})
			}
		})
	}
}


exports.uploadWikitext = function (options, sandbox, next) {
	
	// upload wikitext
	sandbox.client.edit(options.title, options.wikitext, 'test', function(err) {
		sandbox.context.error = err;
		next();
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

