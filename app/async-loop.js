var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path        = require('path');
var mongoquery 	= require("../app/mongo-query.js");
var collection = require("../app/collection.js");
const MP 		= require("../config/const.js");


var exports = module.exports = {};

exports.loop = function (node, sandbox, onDoc) {

	loop (node, sandbox, onDoc);
	
	mongoquery.update("mp_projects", {_id:node.project}, {$addToSet:{"schemas": {"keys": sandbox.out.schema, "types": sandbox.out.key_type, "collection":node.collection}}}, function (error) {
		if(error)
			console.log(error);
		else
			console.log("SCHEMA saved");
	})

}


function loop (node, sandbox, onDoc) {


	// create scripts (this will catch syntax errors)
	try {
		sandbox.run = new vm.createScript(node.scripts.run);
	} catch (e) {
		console.log("ERROR:", e.stack);
		console.log(node.scripts.run);
		sandbox.out.say("error", "Error in node: 'run' script: " + e.name +" " + e.message);
		sandbox.out.say("error", "Slap the node writer!");
		return;
	}
	
	try {
		sandbox.pre_run = new vm.createScript(node.scripts.pre_run);
	} catch (e) {
		console.log("ERROR:", e.stack);
		sandbox.out.say("error", "Error in node: 'pre_run' script: " + e.name +" " + e.message);
		return;
	}

	// find everything
	mongoquery.find2({}, node.collection, function (err, docs) {
		
		sandbox.context.doc_count = docs.length;
	
		runNodeScriptInContext("init", node, sandbox);
		
		console.log(node.settings);
		
		// run node once per record
		require("async").eachSeries(docs, function iterator (doc, next) {

			sandbox.context.doc = doc;
			sandbox.context.count++;
			
			// call document processing function
			onDoc(doc, sandbox, function processed () {
				if(sandbox.out.setter != null) {
					var setter = sandbox.out.setter; 
				} else {
					var setter = {};
					setter[node.out_field] = sandbox.out.value;
				}
				console.log("setter:", setter);
				
				mongoquery.update(node.collection, {_id:sandbox.context.doc._id},{$set:setter}, next);
			});

		}, function done () {
			runNodeScriptInContext("finish", node, sandbox);
		});
	});

}


function runNodeScriptInContext (script, node, sandbox) {
	try {
		vm.runInNewContext(node.scripts[script], sandbox);
	} catch (e) {
		if (e instanceof SyntaxError) {
			console.log("Syntax error in node.scripts."+script+"!", e);
			//io.sockets.emit("error", "Syntax error in node.scripts."+script+"!</br>" + e);
			throw new NodeScriptError("syntax error:" + e.message);
		} else {
			console.log("Error in node.scripts."+script+"!",e);
			//io.sockets.emit("error", "Error in node.scripts."+script+"!</br>" + e);
			throw new NodeScriptError(e.message);
		}
	}
}

function NodeScriptError (message) {
	this.message = message;
	this.name = "NodeScriptError";
}
