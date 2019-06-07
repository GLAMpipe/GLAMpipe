
const vm 		= require("vm");
var db 			= require('./db.js');
var pdf 		= require('./cores/file-pdf.js');
const GP 		= require("../config/const.js");

var exports 	= module.exports = {};

exports.process = {

	'PDF': {
		'totext': async function(node) {
			await fileLoop(node, pdf.toText);
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

	var bulk = db[node.collection].initializeOrderedBulkOp();
    const cursor = db[node.collection].findAsCursor({});	
	while(await cursor.hasNext()) {
		var doc = await cursor.next();
	  
		node.sandbox.context.doc = doc;
		node.sandbox.core.data = null;
		var setters = [];

		// WIP: pitäisko noden saada kerralla kaikki tulokset? vai kutsutaanko node kerran jokaisen rivin kohdalla?
		// run.js: pitää asettaa setter!!!

		
		// PRE_RUN - give input to core (core.files)
		node.scripts.pre_run.runInContext(node.sandbox);
		
		// CALL CORE - if there are several files, then call core once for every row
		if(Array.isArray(node.sandbox.core.files)) {
			for(var file of node.sandbox.core.files) {
				var core_result = await core(node);
				node.sandbox.core.data = core_result;	
				node.scripts.run.runInContext(node.sandbox);
				setters.push(node.sandbox.out.setter)			
			}

		} else {
			var core_result = await core(node);
			node.sandbox.core.data = core_result;
			node.scripts.run.runInContext(node.sandbox);
			setters.push(node.sandbox.out.setter)
		}	
		
		node.sandbox.out.setter = combineSetters(setters);
		var update = {'pdf_text':'koira', 'pdf_info': 'dd'}

		//var update = {}
		// if out.value is set, then we write field defined in settings.out_field
		//if(node.sandbox.out.value) {
			update[node.source.params.out_field] = node.sandbox.out.value;
		//}
	  
		bulk.find({ '_id': doc._id }).updateOne({
			'$set': update
		});
	}	
	
	// make changes to database
	await bulk.execute();
	
	// notify that we are finished
	//node.sandbox.out.say('finish', 'Done');
}


async function syncLoop(node) {

	try {
		// check if run.js is provided in settings
		if(node.settings.js) {
			var run = new vm.createScript(node.settings.js);
			node.scripts.run = run;
		}

		var bulk = db[node.collection].initializeOrderedBulkOp();
		const cursor = db[node.collection].findAsCursor({});	
		while(await cursor.hasNext()) {
			var doc = await cursor.next();
		  
			node.sandbox.context.doc = doc;
			node.scripts.run.runInContext(node.sandbox);
			var update = {}
			// if out.value is set, then we write field defined in settings.out_field
			if(node.sandbox.out.value) {
				update[node.source.params.out_field] = node.sandbox.out.value;
			}
		  
			bulk.find({ '_id': doc._id }).updateOne({
				'$set': update
			});
		}	
		
		// make changes to database
		await bulk.execute();
	} catch (e) {
		node.sandbox.out.say("finish", "Error in Script node: 'run' script: " + e.name +" " + e.message);
		throw(new Error("Error in Script node: 'run' script: " + e.name +" " + e.message))
		
	}	
	// notify that we are finished
	//node.sandbox.out.say('finish', 'Done');
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
