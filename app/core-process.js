
const vm 		= require("vm");
var mongoist 	= require("mongoist")
var db 			= require('./db.js');
var pdf 		= require('./cores/pdf.js');
const GP 		= require("../config/const.js");

var exports 	= module.exports = {};

exports.process = {

	'PDF': {
		'totext': async function(node) {
			await fileLoop(node, pdf.toText_test);
		}
	},
	
	'sync': {
		'script': async function(node) {
			await syncLoop(node);
		}
	}
}



// loop through documents
async function fileLoop(node, core) {
	const fs = require("fs-extra");

	var bulk = db[node.collection].initializeOrderedBulkOp();

    const cursor = db[node.collection].findAsCursor({});	
	while(await cursor.hasNext()) {
		var doc = await cursor.next();
	  
		node.sandbox.context.doc = doc;
		node.sandbox.core.data = [];

		// run.js: pitää asettaa setter!!!
		// PRE_RUN - give input to core (core.files)
		node.scripts.pre_run.runInContext(node.sandbox);
		
		// CALL CORE - if there are several files, then call core once for every row
		if(Array.isArray(node.sandbox.core.files)) {
			for(var file of node.sandbox.core.files) {
				// check that file exists
				console.log('FILE:' + file)

					try {
						await fs.access(file);
						console.log('Processing PDF..')
						var core_result = await core(node, file);
						console.log('Processing DONE!')
						console.log('core_result: ' +core_result)
						node.sandbox.core.data.push(core_result);
							
					} catch(e) {
						//console.log('ERROR in PDF processing')
						console.log(e.message)
						if(e.message)
							node.sandbox.core.data.push({'error': e.message});	
						else
							node.sandbox.core.data.push({'error': e});	
						
					}

			}
		} else {
			var core_result = await core(node);
			node.sandbox.core.data = core_result;
		}	

		node.scripts.run.runInContext(node.sandbox);
		bulk.find({ '_id': doc._id }).updateOne({
			'$set': node.sandbox.out.setter
		});
	}	
	
	// make changes to database
	await bulk.execute();
	
	// notify that we are finished
	//node.sandbox.out.say('finish', 'Done');
}


async function syncLoop(node) {


	try {
		// check if run.js code is provided in settings
		if(node.settings.js) {
			var run = new vm.createScript(node.settings.js);
			node.scripts.run = run;
		}

		var query = {};
		var offset = node.options.offset || 0; 
		var limit = node.options.limit || 0; 
		var doc_id = node.settings.doc_id || ''; 
		if(doc_id) query = {"_id": mongoist.ObjectId(doc_id)};
		
		node.sandbox.context.total = await db[node.collection].count({});
		var bulk = db[node.collection].initializeOrderedBulkOp();
		const cursor = db[node.collection].findAsCursor(query).skip(offset).limit(limit);	
		var counter = 0;
		while(await cursor.hasNext()) {
	
			var doc = await cursor.next();
			counter++;
			node.sandbox.context.doc = doc;
			node.sandbox.context.vars.count = counter;
			
			node.scripts.run.runInContext(node.sandbox);
			if(counter === 1) await node.updateSourceKey("schema", node.sandbox.out.setter);

			// if out.value is set, then we write to the field defined in settings.out_field
			var update = {}
			if(node.sandbox.out.setter) {
				update = node.sandbox.out.setter;
			} else if(node.sandbox.out.value) {
				update[node.source.params.out_field] = node.sandbox.out.value;
			} 
			
			// TODO: decide what should be saved if out is not set?
			
			bulk.find({ '_id': doc._id }).updateOne({
				'$set': update
			});
			
			if (counter % 1000 == 0 ) {
				var w = await bulk.execute();
				//console.log(w)
				bulk = db[node.collection].initializeOrderedBulkOp();
				if(process.send)
					process.send({node_uuid:node.uuid, project:node.project,total:node.sandbox.context.total,counter:1000});
			}
		}	
		
		// execute remainig changes to database
		await bulk.execute();
	} catch (e) {
		node.sandbox.out.say("finish", "Error in Script node: 'run' script: " + e.name +" " + e.message);
		console.log(e.stack);
		throw(new Error("Error in Script node: 'run' script: " + e.name +" " + e.message))
		
	}	
	// notify that we are finished
	//node.sandbox.out.say('finish', 'Done');
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


// create one setter object for Mongo based on individual setter objects
// NOTE: this assumes that setter objects have identical keys
function combineSetters(setters) {
	if(Array.isArray(setters) && setters.length) {
		var keys = Object.keys(setters[0]);
		var c_setter = {};
		keys.forEach(function(key) {
			c_setter[key] = [];
		})

		setters.forEach(function(setter) {
			var setter_keys = Object.keys(setter);
			//console.log(setter)
			//console.log("setter_keys");
			//console.log(setter_keys);
			setter_keys.forEach(function(s_key) {
				c_setter[s_key].push(setter[s_key]);
			})
		})
		//console.log(c_setter);
		return c_setter;
	} else
		return null;
}
