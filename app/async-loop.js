var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path		= require('path');
var mongoquery	= require("../app/mongo-query.js");
var collection	= require("../app/collection.js");
const MP 		= require("../config/const.js");


var exports = module.exports = {};

exports.loop = function (node, sandbox, onDoc) {
	
	// ONE DOC (single run)
	if(node.req && node.req.params.doc) {
		console.log("NODE: single doc")
			
		mongoquery.findOneById (node.req.params.doc, node.collection, function (doc) {
			if(doc) {
				sandbox.context.doc = doc;
				sandbox.context.doc_count = 1;
				// call document processing function
				onDoc(doc, sandbox, function processed () {
					console.log("sandbox.out.value:" + sandbox.out.value);
					console.log("sandbox.out.setter:");
					console.log(JSON.stringify(sandbox.out.setter, null, 4))
					if(sandbox.out.setter != null) {
						var setter = sandbox.out.setter; 
					} else {
						var setter = {};
						setter[node.out_field] = sandbox.out.value;
					}
					
					if(sandbox.context.skip)
						sandbox.finish.runInContext(sandbox);
					else {
						mongoquery.update(node.collection, {_id:sandbox.context.doc._id},{$set:setter}, function() {
							sandbox.finish.runInContext(sandbox);
						});
					}
				});	
			}		
		})

	// LOOP ALL DOCS
	} else {
		loop (node, sandbox, onDoc);
	}
	
	//mongoquery.update("mp_projects", {_id:node.project}, {$addToSet:{"schemas": {"keys": sandbox.out.schema, "types": sandbox.out.key_type, "collection":node.collection}}}, function (error) {
		//if(error)
			//console.log(error);
		//else
			//console.log("SCHEMA saved");
	//})
}



// mongoLoop runs mongo queries per document (lookupLoop)
exports.mongoLoop = function (node, sandbox, onDoc) {

	// find everything
	mongoquery.find2({}, node.collection, function (err, docs) {
		
		sandbox.context.doc_count = docs.length;
		console.log(node.settings);
		console.log("collection: " + node.collection);
		
		// run node once per record
		require("async").eachSeries(docs, function iterator (doc, next) {

			sandbox.context.doc = doc;
			sandbox.context.count++;
			//onsole.log(doc.basename);
			sandbox.pre_run.runInContext(sandbox);
			
			// call document processing function
			onDoc(doc, sandbox, function processed () {
				
				console.log("search:", sandbox.out.pre_value);
				// we always set value even if there is no query
				if(!sandbox.out.pre_value) {
					var set_value = {};
					set_value[node.params.out_field] = "";
					var setter = {$set:set_value}
					mongoquery.update(node.collection, {_id:sandbox.context.doc._id}, setter, next);
				} else {
					
					// search here. We assume that key is unique
					 mongoquery.find2(sandbox.out.pre_value, node.params.source_collection, function (err, docs) {
						if(err)
							console.log(err);
						if(docs.length) {
							var set_value = {};
							set_value[node.params.out_field] = docs[0][node.params.copy_field]
							var setter = {$set:set_value}
							
						} else {
							var set_value = {};
							set_value[node.params.out_field] = "";
							var setter = {$set:set_value}
						}
						//console.log(setter);
						mongoquery.update(node.collection, {_id:sandbox.context.doc._id}, setter, next);
					 }) 
				 }
				
				// update here
				//mongoquery.update(node.collection, {_id:sandbox.context.doc._id}, setter, next);
				//next();
			});

		}, function done () {
			sandbox.finish.runInContext(sandbox);
		});
	});
}

// source loop creates a new collection. Clears collection in the beginning
exports.sourceLoop = function (node, sandbox, onDoc) {

	// find everything from source collection
	mongoquery.find2({}, node.params.source_collection, function (err, docs) {
		// empty node collection
		mongoquery.empty(node.collection, {}, function() {
			
			sandbox.context.doc_count = docs.length;
			
			// run node once per record
			require("async").eachSeries(docs, function iterator (doc, next) {
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
exports.importLoop = function (node, sandbox, onDoc) {

	var async = require("async");

	// empty node collection
	mongoquery.empty(node.collection, {}, function() {
		
		//sandbox.context.doc_count = docs.length;
		
		// run node once per record
		async.eachSeries(sandbox.context.pre_value, function iterator (url, next) {
			//sandbox.context.doc = doc;
			sandbox.context.count++;
			var options = {url:url}
			
			// call document processing function
			onDoc(options, sandbox, function processed (error) {
				console.log(options);
				sandbox.run.runInContext(sandbox);
				sandbox.out.value[MP.source] = node._id;
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


// loop updates existing documents
function loop (node, sandbox, onDoc) {

	// find everything
	mongoquery.find2({}, node.collection, function (err, docs) {
		
		sandbox.context.doc_count = docs.length;
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
				//console.log("setter:", setter);
				if(sandbox.context.skip)
					next();
				else
					mongoquery.update(node.collection, {_id:sandbox.context.doc._id},{$set:setter}, next);
			});

		}, function done () {
			sandbox.finish.runInContext(sandbox);
		});
	});
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

	var query = {};
	// ONE DOC
	if(node.req && node.req.params.doc) {
		console.log("NODE: single doc")
		query = {"_id" : mongojs.ObjectId(node.req.params.doc)}
	}

	// find everything
	mongoquery.find2(query, node.collection, function (err, docs) {
		
		sandbox.context.doc_count = docs.length;
		console.log(onDoc);
		
		// run node once per record
		require("async").eachSeries(docs, function iterator (doc, nextDocument) {

			sandbox.context.doc = doc;
			sandbox.out.value = null;
			sandbox.context.count++;
			sandbox.pre_run.runInContext(sandbox);
			
			// check if pre_value is array
			if(Array.isArray(sandbox.out.pre_value)) {
				var result = [];
				var setters = [];
				
				// loop over field array
				require("async").eachSeries(sandbox.out.pre_value, function iterator (row, nextFieldRow) {
					sandbox.context.data = null;

					// call document processing function
					onDoc(row, sandbox, function processed () {
						//console.log(row);
						sandbox.out.setter = null;
						sandbox.run.runInContext(sandbox); // sets "context.out.value"
						if(sandbox.out.setter)
							setters.push(sandbox.out.setter)
						else
							result.push(sandbox.out.value);
							
						nextFieldRow();
					});

				}, function done () {
					var setter = combineSetters(setters);
					if(!setter) {
						var setter = {};
						setter[node.out_field] = result;
					}

					mongoquery.update(node.collection, {_id:sandbox.context.doc._id},{$set:setter}, nextDocument);
				});
				
			} else {
				console.log(sandbox.out.pre_value)
				// call document processing function
				onDoc(sandbox.out.pre_value, sandbox, function processed () {
					sandbox.out.setter = null;
					sandbox.run.runInContext(sandbox); // sets "context.out.value"
					var setter = sandbox.out.setter;
					if(!setter) {
						setter = {};
						setter[node.out_field] = sandbox.out.value;
					}
					mongoquery.update(node.collection, {_id:sandbox.context.doc._id},{$set:setter}, nextDocument);
				});
			}

		}, function done () {
			sandbox.finish.runInContext(sandbox);
		});
	});
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
			setter_keys.forEach(function(s_key) {
				c_setter[s_key].push(setter[s_key]);
			})
		})
		console.log(c_setter);
		return c_setter;
	} else
		return null;
}
