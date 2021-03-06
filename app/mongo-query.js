
var mongojs 	= require('mongojs');
var async 		= require("async");
const util 		= require('util');
var database 	= require('../config/database');
var buildquery 	= require("./query-builder.js");

var db = mongojs(database.initDBConnect());

db.on("error", function(e) {
    throw("dberror","ERROR: can not connect to database (mongodb).\nPlease note that just installing mongodb is not enough.\nYou must also have it *running*.")
});
    
db.on("connect", function() {
    console.log("DB: connected!")
});
    

var exports = module.exports = {};


function sleep(time, callback) {
    var stop = new Date().getTime();
    while(new Date().getTime() < stop + time) {
        ;
    }
    //callback();
}

exports.createBulk = function () {
	return  db.items.initializeUnorderedBulkOp();
}

// *********************************************************************
// ******************************* FIND  *******************************
// *********************************************************************

exports.stats = function (collectionname, callback) {
	var collection = db.collection(collectionname);
	collection.stats(function (err, result) {
		callback(err, result);
	}); 
}



exports.loopOver = function (query, collectionname, callback) {
	var collection = db.collection(collectionname);
	collection.find(query).forEach(function (err, result) {
		callback(err, result);
	});  
}

exports.findAll = function (params, callback) {
	var collection = db.collection(params.collection);
	var sort = {};
	var sort_order = 1;
	if(params.reverse)
		sort_order = -1;
	sort[params.sort] = sort_order;
	
	if(params.keys) {
		collection.find(params.query, params.keys).sort(sort).limit(params.limit).skip(params.skip, function(err, docs) { callback(docs); });
	} else {
		collection.find(params.query).sort(sort).limit(params.limit).skip(params.skip, function(err, docs) { callback(docs); });
		
	}
}

exports.find2 = function (query, collectionname, callback) {

	var collection = db.collection(collectionname);
	if(callback) {
		collection.find(query, function (err, result) {
			callback(err, result);
		});   
	// return cursor if no callback defined
	} else {
		return collection.find(query);
	}
}

exports.findFields = function (query, fields, sort, collectionname, callback) {

	var collection = db.collection(collectionname);
	collection.find(query, fields).sort(sort, function (err, result) {
		callback(err, result);
	});   
}

exports.findCursor = function (query, collectionname) {

	var collection = db.collection(collectionname);
	return collection.find(query);
}


exports.find = function (query, collectionname, callback) {

	var collection = db.collection(collectionname);

	collection.find(query ,function (err, result) {
		if (err) {
			console.log(err);
			callback({"error":err})
		} else if (result.length) {
			callback(err, result);
		} else {
			console.log("No document(s) found from", collectionname);
			callback({"error":err})
		}
	});   
}


exports.findWithResultFields = function (query, resultField, collectionname, callback) {

	var collection = db.collection(collectionname);

	collection.find(query ,resultField ,function (err, result) {
		if (err) {
			console.log(err);
			callback({"error":err})
		} else if (result.length) {
			callback(err, result);
		} else {
			console.log("No document(s) found from", collectionname);
			callback({"error":err})
		}
	});   
}

exports.findOne = function (query, collectionname, callback) {
    
  
	var collection = db.collection(collectionname);

	collection.findOne(query ,function (err, result) {
		if (err) {
			//console.log("ERROR:", err.message);
			callback(err, result)
		} else {
			callback(err, result);
		}
	});   
}

exports.findOneProjection = function (query, projection, collectionname, callback) {
    
	var collection = db.collection(collectionname);

    
	collection.findOne(query, projection, function (err, result) {
		if (err) {
			console.log("ERROR:", err);
			callback(null)
		} else {
			callback(result);
		}
	});   
}


exports.findOneById = function (doc_id, collectionname, callback) {
	try {
		exports.findOne ({_id: mongojs.ObjectId(doc_id)}, collectionname, function (err, data) {
			callback(data);
		})
	} catch(e) {
		console.log("ERROR: mongo-query.findOneById:" + e.message)
		callback(null);
	}
}


exports.findDistinct = function (query, collectionname, key, callback) {
	
	var collection = db.collection(collectionname);
	
	collection.distinct(key, query, function(err, list) {
		console.log(err);
	   callback(err, list);
	});
	
	
}

exports.countDocs = function (collectionname, query, callback) {
	
	var collection = db.collection(collectionname);

	collection.count(query, function(err, count) {
		if(err) {
			console.log(err);
			callback("error in count");
		} else {
			callback(count.toString());
		}
	});
}




exports.findProjectNode = function (node_id, callback) {
	
	var collection = db.collection("mp_projects");
	var query = {nodes:{$elemMatch:{_id:mongojs.ObjectId(node_id)}}};

	collection.findOne(query, {title:1, "nodes.$":1}, function (err, result) {
		if (err) {
			console.log("ERROR:", err);
			callback(err, result)
		} else {
			callback(err, result);
		}
	}); 

	//exports.findOne (query, "mp_projects", function (err, node) {
		//callback(err, node);
	//})
}

exports.getCollections = function (callback) {
	db.getCollectionNames(function(err, colNames) {
	  if (err) console.log(err);
	  callback(err, colNames);
	});
}
// *********************************************************************
// ******************************* INSERT ******************************
// *********************************************************************



exports.createCollection = function (collectionname, callback) {
	db.createCollection(collectionname, function(err, data) {
		if(err)
			console.log(err);
		console.log("created collection", collectionname);
		callback();
	});
}

exports.insertProject = function (doc, callback) {
	
	exports.insert("mp_projects", doc, callback);

}

exports.runLog = function (doc, callback) {
	
	exports.insert("mp_runlog", doc, callback);
	
}

exports.insert = function (collectionname, doc, callback) {

	var collection = db.collection(collectionname);

	collection.insert(doc ,function (err, result) {
		if (err) {
			console.log(err);
			callback(err, result)
		} else {
			// console.log('MONGO: inserted to', collectionname);
			callback(null, result);
		}
	}); 
}

exports.insertOutput = function (doc, callback) {

	var collection = db.collection('outputs');

	collection.insert(doc ,function (err, result) {
		if (err) {
			console.log(err);
			callback({'error':err})
		} else {
			console.log('Inserted');
			callback({});
		}
	}); 
}



exports.update = function (collectionname, query, doc, callback) {

	var collection = db.collection(collectionname);

	collection.update(query, doc , {multi:true}, function (err, result) {
		if (err) {
			console.log(err);
			callback(err, result);
		} else {
			callback(null, result);
		}
	}); 
}


exports.updateSingle = function (collectionname, query, doc, callback) {

	var collection = db.collection(collectionname);

	collection.update(query, doc , {multi:true}, function (err, result) {
		console.log(result)
		console.log(query)
		console.log(doc)
		if (err) {
			console.log(err);
			callback(err);
		} else {
			callback(null, result);
		}
	}); 
}

exports.updateById = function (collectionname, doc_id, doc, callback) {

	var collection = db.collection(collectionname);
	var query = {_id: mongojs.ObjectId(doc_id)};
	console.log(query)
	//doc = {"$set":{"dc_contributor_author":"koira"}}
	console.log(doc);
	collection.update(query, doc , {multi:true}, function (err, result) {
		if (err) {
			console.log(err);
			callback(err);
		} else {
			console.log(result);
			callback();
		}
	}); 
}

// add empty fields to collection
exports.addFieldToCollection = function (collectionname, field, cb) {
	var add = {};
	var update = {};
	if(Array.isArray(field))
		field.forEach(function(f) {if(f) add[f] = null});
	else
		if(f)
			add[field] = null;
			
	
	if(Object.keys(add).length)
		update = {$set:add}
	else
		return cb();
		
	exports.update(collectionname, {}, update, cb);
	
}

// *********************************************************************
// ******************************* DELETE ******************************
// *********************************************************************


exports.remove = function (doc_id, collectionname, callback) {
	var collection = db.collection(collectionname);

	collection.remove({_id: mongojs.ObjectId(doc_id)} ,function (err, result) {
		if (err) {
			console.log(err);
			callback({'error':err})
		} else {
			console.log('DB: removed ' + doc_id);
			callback(null, {status:'ok'});
		}
	}); 
}



exports.foreach = function (collectionname, func) {
	var collection = db.collection(collectionname);
	collection.foreach({}, func);
}

exports.save = function (collectionname, doc, callback) {
	var collection = db.collection(collectionname);
	collection.save(doc, function () {console.log('SAVED to', collectionname)});
}

exports.removeKey = function (collectionname, key, callback) {
	var collection = db.collection(collectionname);
    var unset = {};
    unset[key] = 1;
    collection.update({},{$unset: unset}, {multi: true}, function(err, result) {
		if(err)
			console.log(err);
        else
            console.log('DB: removed key', key);
		callback(); 
    });
}


exports.drop = function (collectionname, callback) {
	var collection = db.collection(collectionname);
	collection.drop( function () {
		console.log('DB: dropped', collectionname);
		callback();
	});
}


exports.empty = function (collectionname, doc, callback) {
	var collection = db.collection(collectionname);
	collection.remove(doc, function (err) {
		if(err)
			console.log(err);
		console.log('emptied', collectionname);
		callback();
	});
}


exports.updateAll = function (collectionname, query, callback) {
	
	var collection = db.collection(collectionname);

	collection.update({}, query, {multi:true} ,function (err, result) {
		if (err) {
			console.log(err);
			callback({'error':err})
		} else {
			callback();
		}
	}); 

}

exports.nodes = function (callback) {

	var collection = db.collection("mp_nodes");
	var tags = {}
	if(global.config.tags && Array.isArray(global.config.tags))
		tags = {tags:{$in:global.config.tags}}

	collection.aggregate([

		// filter by tags
		{$match:tags},
		// group by subtype
		{$group : {_id: {subtype:"$subtype", type:"$type"}, description : { $first: "$type_desc" },"nodes": {$push: {
			title:"$title",
            status:"$status",
			nodeid:"$nodeid",
			type:"$type",
			tags:"$tags",
			subtype:"$subtype",
			description: "$description",
			views:"$views",
			settings:"$settings",
			id:"$_id"
			}}}},
		// group by main type
		{$group: {_id:{type:"$_id.type", description:"$description"}, subtypes:{$push: {sub:"$_id", nodes:"$nodes"}}}}

		],
		function (err, data) {
			if(data.length > 0)
				callback(data);
			else
				callback();
		}
	)

}

exports.group = function (node, array, callback) {

	var collection = db.collection(node.params.source_collection);
	var field_name = "$" + node.params.source_field;
	var project = {};
	project[node.params.source_field] = 1;
	project["_id"] = 1;
	var project2 = { count:1, ids: 1, _id: 0 };
	var project2 = { count:1, _id: 0 };
	project2[node.params.source_field] = "$_id";	// preserve original field name
	
	if(array)
		var unwind = {$unwind: field_name};
	else
		var unwind = {};


	collection.aggregate([
		{$project: project},
		{$unwind: field_name},
		{$group : {_id: field_name, count: {$sum:1}}}, 
		{$project: { _id: 0, "name": "$_id", count:1 } },
		{$sort: { count: 1 }}
		// use $out for mongo 2.6 and newer
		],
		function (err, data) {

			if(err) {
				console.log(err.message);
				// did not work, try with non-array
				console.log("trying witn non-array");
				collection.aggregate([
					// {"$match": {"author":{"$ne": ""}} },
					{$project: project},
					{$group : {_id: field_name, count: {$sum:1}}}, 
					{$project: project2 },
					{$sort: { count: -1 }}
					// use $out for mongo 2.6 and newer
					],
					function (err, data) {
						if(err)
							console.log(err);
						callback(data);
					}
				)
			} else {
				callback(data);
			}
		}
	)


}


exports.facet = function (req, callback) {
	var col = require("../app/collection.js");
	var filters = [];
	var collection = db.collection(req.params.collection);
	var fields = req.query.fields.split(",").map(function(item) {
		return item.trim();
	});
	var filters = [];
	var skip = ["skip", "limit", "sort", "reverse", "op", "fields"]; 
	var operators = buildquery.operators(req);
	const AS_ARRAY = true;
	var filters = buildquery.filters(req, operators, skip, AS_ARRAY);

	// check if field is array
	col.getKeyTypes(req.params.collection, function(fieldTypes) {
		console.log("\nFACET QUERY:" + req.url);
		var aggr = buildAggregate(fields, fieldTypes, filters);
		aggregate(collection, aggr, function(data) {
			callback(data);
		})
	})
}

function buildAggregate (fields, fieldTypes, filters) {

	var aggregate = [];
	var facets =  { $facet: {}};
	// build aggregate
	if(filters.length)
		aggregate.push({$match: {$and:filters}});
		aggregate.push(facets);

	// generate facets
	fields.forEach(function(field) {
		var facet = [];
		if(fieldTypes[field] === "array") {
			facet.push({ $unwind: "$" + field });
		}

		facet.push({ $group: {_id: "$" + field, count: { $sum: 1}}});
		facet.push({ $sort: { count : -1 }});
		
		facet.push({ $limit: 100 }); // just in case
		facets["$facet"][field] = facet;
	})

	console.log("AGGREGATE:\n" + util.inspect(aggregate, false, null, true));
	console.log("\n");
	return aggregate;
}


function aggregate (collection, aggregate, callback) {

	//console.log(JSON.stringify(aggregate, null, 2));
	collection.aggregate(
		aggregate
		,
		function (err, data) {
			if(err) {
				console.log("field is NOT an array");
				console.log(err);
				callback(data);

			} else {
				callback(data);
			}
		}
	) 
}


exports.collectionLookup = function (sandbox, node, onNodeScript, onError) {

	var collection = db.collection(node.collection);
	var key = node.params.target_key;
	var value = sandbox.out.value;
	onNodeScript(sandbox);

}

exports.closeDB = function () {
	db.close();
}





exports.getProject = function (title, callback) {
	console.log("getProject called for project ",title );
	var query = {"title":title};
	exports.findOne(query, "mp_projects", function(err, msg) {callback(msg)} );
}

exports.getFunc = function (id, callback) {
	console.log('getFunc called for func ',id );
	var query = {"_id":mongojs.ObjectId(id)};
	exports.findOne(query, 'functions', function(err, msg) {callback(msg)} );
}

exports.getSource = function (id, callback) {
	console.log('getSource called ',id );
	var query = {"_id":mongojs.ObjectId(id)};
	exports.findOne(query, 'sources', function(err, msg) {callback(msg)} );
}

exports.getAllProjects = function (callback) {

	var collection = db.collection("mp_projects");

	//collection.count(function(err, docs) {console.log("COUNT:", docs)});
	collection.find({}).sort({_id:-1}, function(err, docs) { callback(docs); });

}


exports.getProjectNode = function (id, callback) {
	var collection = db.collection("mp_projects");
	collection.find({"nodes._id": mongojs.ObjectId(id)}, {_id: 0, 'nodes.$': 1}, function(err, docs) { 
		callback(err, docs);
		});
}

exports.dropCollection = function (collectionName, callback) {
	var collection = db.collection(collectionName);
	collection.drop(function (err) {
		console.log("DB: dropped collection " + collectionName )
		callback(err);
	});
}

exports.markNodeAsExecuted = function (node) {
	
}

exports.removeDuplicates = function(collectionName, dupField, cb) {


	var collection = db.collection(collectionName);

/*
.aggregate([{$group:{_id:"$dc_date_issued", dups:{$push:"$_id"}, count: {$sum: 1}}},
{$match:{count: {$gt: 1}}}
]).forEach(function(doc){
  doc.dups.shift();
  db.dups.remove({_id : {$in: doc.dups}});
});
*/
	collection.aggregate([
		{$group: {
			_id: {mid:"$" + dupField},
			uniqueIds: {$push: "$_id"},
			count: {$sum: 1}
			}
		},
		{$match: { 
			count: {"$gt": 1}
			}
		},
		{$sort: {
			count: -1
			}
		}
	],
		function (err, data) {
			if(err) {
				cb({});
			} else {
			console.log(dupField)
				cb(data);
			}
		}
	);

}

// creates an object for mongoquery array update wiht positional operator ($)
function createParamsObject(arrayName, params) {

	var result = {};
	for (var p in params) {
		if( params.hasOwnProperty(p) && p != "apikey") {
		  result[arrayName + ".$." + p] =  params[p];
		} 
	}
    //console.log("******************************");
    //console.log(params);
    console.log(result);
    //console.log("******************************");
	return result;
}



