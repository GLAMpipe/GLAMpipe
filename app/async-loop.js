var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path		= require('path');
var mongoquery	= require("../app/mongo-query.js");
var collection	= require("../app/collection.js");
const MP 		= require("../config/const.js");


var exports = module.exports = {};

// loop for synchronous nodes and export nodes (export is done once per document)
exports.documentLoop = function (node, sandbox, onDoc) {
	
	sandbox.out.say("progress", "Processing started...");

	var mode = "batch";
	var query = {};
	// ONE DOC (single run)
	if(node.req && node.req.params.doc) {
		console.log("LOOP: single doc (" + node.req.params.doc + ")");
		query = {"_id" : mongojs.ObjectId(node.req.params.doc)};
		mode = "single";
	}

	var cursor = mongoquery.find2(query, node.collection);
	processDataSync(node, sandbox, onDoc, mode, cursor);
}


// loop for running complex (asynchronous) nodes
// - pre_run.js is called *once* per document -> outputs an array (sandbox.pre_value)
// - for(sandbox.pre_value)
//       call "onDoc"
//           - output: sandbox.context.data
//       call node's run.js
//           - processes: sandbox.context.data
//           - output: out.setter (multiple fields) or out.value (single field)
exports.fieldLoop = function (node, sandbox, onDoc) {

	sandbox.out.say("progress", "Processing started...");
	var query = {};
	// ONE DOC
	if(node.req && node.req.params.doc) {
		console.log("FIELD LOOP: single doc:" + node.req.params.doc)
		query = {"_id" : mongojs.ObjectId(node.req.params.doc)}
	}

	var cursor = mongoquery.find2(query, node.collection);
	processDataAsync(node, sandbox, onDoc, cursor);

}



exports.importLoop = function (node, sandbox, onDoc) {
	console.log("IMPORT LOOP");

	// remove previous data inserted by node and start query loop
	var query = {};
	query[MP.source] = node._id;
	mongoquery.empty(node.collection, query, function() {
		// pre_run will give us an initial url
		sandbox.pre_run.runInContext(sandbox);
		console.log("URL:", sandbox.out.options.url)
		requestLoop2(node, sandbox, onDoc);
	});
}



// this keeps asking data until there is no url
function requestLoop2(node, sandbox, onDoc) {
	var async = require("async");
	async.series([
		function (done) {


			sandbox.context.data = null;
			onDoc(sandbox.out.options, sandbox, function processed () {

					if(sandbox.error)
						console.log(sandbox.error);

					sandbox.out.setter = null;
					sandbox.out.value = null;
					sandbox.out.error = null;
					sandbox.context.skip = null;

					try {
						sandbox.run.runInContext(sandbox);
					} catch(e) {
						console.log(e);
						sandbox.out.error = "errorin in run.js:" + e.message;
						sandbox.finish.runInContext(sandbox);
						return;
					}

					if(sandbox.out.value) {
						if(Array.isArray(sandbox.out.value)) {
							// mark items with node id
							sandbox.out.value.forEach(function(item) {
								item[MP.source] = node._id;
							})
							mongoquery.insert(node.collection, sandbox.out.value, done);
						}
					} else {
						done();
					}
			});

		}

	], function done(err, result) {
		if(err) {
			console.log(err);
			return;
		}

		// check if user asked for termination of the node run
		if(!node.req.query.force && !global.register[node.req.originalUrl]) {
			console.log("REGISTER: user terminated node run...");
			sandbox.finish.runInContext(sandbox);
			return;
		}

		// if node provides new url, then continue loop
		if (sandbox.out.options) {
			requestLoop2(node, sandbox, onDoc)
		} else {
			if(cb)
				cb();
			else {
				nodescript.runNodeScriptInContext("finish", node, sandbox, io);
				return;
			}
		}
	}
)};





// source loop copies documents from source collection to target collection. Clears collection in the beginning
exports.sourceLoop = function (node, sandbox, onDoc) {

	// find everything from source collection
	mongoquery.find2({}, node.params.source_collection, function (err, docs) {
		// empty node collection
		mongoquery.empty(node.collection, {}, function() {

			sandbox.context.doc_count = docs.length;

			// run node once per record
			require("async").eachSeries(docs, function iterator (doc, next) {

				// check if user asked for termination of the node run
				if(!node.req.query.force && !global.register[node.req.originalUrl]) {
					sandbox.finish.runInContext(sandbox);
					return;
				}
				sandbox.context.doc = doc;
				sandbox.context.count++;

				// call document processing function
				onDoc(doc, sandbox, function processed (error) {
					if(!error && sandbox.out.value)
						mongoquery.insert(node.collection, sandbox.out.value, next);
					else {
						next();
					}
				});

			}, function done () {
				sandbox.finish.runInContext(sandbox);
			});
		})

	});
}

// import loop requests data based on array
exports.importArrayLoop = function (node, sandbox, onDoc) {

	var async = require("async");

	// empty node collection
	mongoquery.empty(node.collection, {}, function() {

		//sandbox.context.doc_count = docs.length;

		// run node once per record
		async.eachSeries(sandbox.context.pre_value, function iterator (url, next) {

			// check if user asked for termination of the node run
			if(!node.req.query.force && !global.register[node.req.originalUrl]) {
				sandbox.finish.runInContext(sandbox);
				return;
			}
			//sandbox.context.doc = doc;
			sandbox.context.error = null;
			sandbox.context.skip = null;
			sandbox.context.count++;
			var options = {url:url}

			// call document processing function
			onDoc(options, sandbox, function processed (error) {
				console.log(options);
				sandbox.run.runInContext(sandbox);
				if(error || sandbox.context.skip || !sandbox.out.value)
					next();
				else {
					sandbox.out.value[MP.source] = node._id;
					mongoquery.insert(node.collection, sandbox.out.value, next);
				}
			});

		}, function done () {
			sandbox.finish.runInContext(sandbox);
		});
	})

}


// delete loop deletes documents
exports.deleteLoop = function(node, sandbox, onDoc) {

	// find everything
	mongoquery.find2({}, node.collection, function (err, docs) {

		sandbox.context.doc_count = docs.length;
		//console.log(node.settings);

		// run node once per record
		require("async").eachSeries(docs, function iterator (doc, next) {

			sandbox.context.doc = doc;
			sandbox.context.count++;

			// call document processing function
			onDoc(doc, sandbox, function processed () {
				console.log("sandbox.out.value");
				console.log(sandbox.out.value);
				if(sandbox.out.value != null) {
					mongoquery.remove(sandbox.out.value, node.collection, next);
				} else {
					next();
				}


			});

		}, function done () {
			sandbox.finish.runInContext(sandbox);
		});
	});
}


function processDataSync (node, sandbox, onDoc, mode, cursor) {
	
	cursor.next(function(err, doc) {
		// quit if there are no more documents
		if(!doc) {
			sandbox.finish.runInContext(sandbox);
			return;
		}
		
		// check if user asked for termination of the node run
		if(!node.req.query.force && !global.register[node.req.originalUrl]) {
			console.log("REGISTER: user terminated node run...");
			sandbox.finish.runInContext(sandbox);
			return;
		}		

		sandbox.context.doc = doc;
		sandbox.context.count++;
		resetSandbox(sandbox);

		// try to call document processing function
		try {
			onDoc(doc, sandbox, function processed () {

				if(Array.isArray(sandbox.out.setter))
					sandbox.out.setter = sandbox.out.setter[0];  // Document loop can have only one setter!!!!

				if(sandbox.out.setter != null) {
					var setter = sandbox.out.setter;
				} else {
					var setter = {};
					setter[node.out_field] = sandbox.out.value;
				}

				updateDoc = createUpdateDoc(node, setter, doc, mode);

				//console.log("updateDoc:", updateDoc);
				if(sandbox.context.skip || node.subtype === "meta")  {// metanodes do not save output
					console.log("NODE: skipping")
					processData(node, sandbox, onDoc, mode, cursor);
				} else
					mongoquery.update(node.collection, {_id:sandbox.context.doc._id}, updateDoc, function() {
						processDataSync(node, sandbox, onDoc, mode, cursor);
					});
			});

		} catch(e) {
			if(e && e.name)
				sandbox.out.say("error", "Error in node: 'run' script: " + e.name +" " + e.message);
			else
				sandbox.out.say("error", "Error in node: 'run' script");
		}
	})
}


function processDataAsync(node, sandbox, onDoc, cursor) {
	
	cursor.next(function(err, doc) {

		// quit if there are no more documents
		if(!doc) {
			sandbox.finish.runInContext(sandbox);
			return;
		}

		// check if user asked for termination of the node run
		if(!node.req.query.force && !global.register[node.req.originalUrl]) {
			console.log("REGISTER: user terminated node run...");
			sandbox.finish.runInContext(sandbox);
			return;
		}

		sandbox.context.doc = doc;
		sandbox.context.count++;
		resetSandbox(sandbox);

		// execute pre_run.js
		try {
			sandbox.pre_run.runInContext(sandbox);
		} catch(e) {
			console.log(e);
			sandbox.out.error = "error in pre_run.js:" + e.message;
			sandbox.finish.runInContext(sandbox);
			return;
		}

		console.log("sandbox.out.pre_value")
		console.log(sandbox.out.pre_value)

		if(Array.isArray(sandbox.out.pre_value)) {
			// make asynchronous request for each row in field
			arrayLoop(sandbox, sandbox.out.pre_value, onDoc, function done(result, setters) {
				var setter = combineSetters(setters);
				if(!setter || Object.keys(setter).length === 0) {
					var setter = {};
					setter[node.out_field] = result;
				}

				mongoquery.update(node.collection, {_id:sandbox.context.doc._id},{$set:setter}, function() {
						processDataAsync(node, sandbox, onDoc, cursor);
					});
				
			});

		} else {
			// make asynchronous request for field value
			onDoc(sandbox.out.pre_value, sandbox, function processed () {
				if(sandbox.error)
					console.log(sandbox.error);
					console.log(sandbox.context.data)
				sandbox.out.setter = null;
				sandbox.run.runInContext(sandbox);
				var setter = sandbox.out.setter;
				if(!setter) {
					setter = {};
					setter[node.out_field] = sandbox.out.value;
				}
				mongoquery.update(node.collection, {_id:sandbox.context.doc._id},{$set:setter}, function() {
						processDataAsync(node, sandbox, onDoc, cursor);
					});
			});
		}
	})	
}


// execute asynchronous function for every row in array
function arrayLoop(sandbox, array, onDocFunc, doneFunc) {

	var result = [];
	var setters = [];

	// loop over field array
	require("async").eachSeries(array, function iterator (row, nextFieldRow) {
		sandbox.context.data = null;
		if(Array.isArray(row)) {
			arrayLoop(sandbox, row, onDocFunc, function(result2, setters2) {
				result.push(result2);
				setters.push(setters2);
				nextFieldRow();
			})
		} else {

			// call document processing function
			onDocFunc(row, sandbox, function processed () {
				if(sandbox.error)
					console.log(sandbox.error);

				sandbox.out.setter = null;
				sandbox.out.value = null;

				try {
					sandbox.run.runInContext(sandbox);
				} catch(e) {
					console.log(e);
					sandbox.out.error = "errorin in run.js:" + e.message;
					sandbox.finish.runInContext(sandbox);
					return;
				}
				//console.log(sandbox.out.setter)
				if(sandbox.out.setter)
					setters.push(sandbox.out.setter)
				else
					result.push(sandbox.out.value);

				sandbox.context.data = null;
				sandbox.context.skip = null;
				sandbox.context.error = null;
				sandbox.out.error = null;
				nextFieldRow();
			});
		}

	}, function done () {
		doneFunc(result, setters);
	});

}

// checks if there are manual edits in fields that are in setter object
function createUpdateDoc(node, setter, doc, mode) {

	var updateDoc = {};
	var manualRemovals = [];
	for(var key in setter) {
		if(doc._mp_manual && doc._mp_manual.includes(key)) {
			// in "batch" mode we do not override manual edit
			if(mode === "batch")
				delete setter[key];
			// in "single" mode we do override + we remove manual edit flags
			else
				manualRemovals.push(key);
		}
	}

	if(manualRemovals)
		updateDoc.$pull = {_mp_manual: {$in:manualRemovals}};

	updateDoc.$set = setter;
	return updateDoc;
}

function resetSandbox(sandbox) {
	sandbox.context.skip = null;
	sandbox.out.value = null;
	sandbox.out.setter = null;
	sandbox.out.error = null;
	sandbox.context.data = null;
	sandbox.context.error = null;
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
