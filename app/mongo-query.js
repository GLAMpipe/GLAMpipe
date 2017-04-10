
var mongojs 	= require('mongojs');
var async 		= require("async");
const util 		= require('util');
var database 	= require('../config/database');
var buildquery 	= require("./query-builder.js");

var db = mongojs(database.initDBConnect());

db.on("error", function(e) {
    throw("dberror","ERROR: can not connect to database (mongodb).\nPlease note that just installing mongodb is not enough.\nYou must also have it *running*.")
});
    
var exports = module.exports = {};


exports.createBulk = function () {
	return  db.items.initializeUnorderedBulkOp();
}

// *********************************************************************
// ******************************* FIND  *******************************
// *********************************************************************

exports.findAll = function (params, callback) {
	var collection = db.collection(params.collection);
	var sort = {};
	var sort_order = 1;
	if(params.reverse)
		sort_order = -1;
	sort[params.sort] = sort_order;
	
	collection.find(params.query).sort(sort).limit(params.limit).skip(params.skip, function(err, docs) { callback(docs); });
}

exports.find2 = function (query, collectionname, callback) {

	var collection = db.collection(collectionname);
	collection.find(query, function (err, result) {
		callback(err, result);
	});   
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

exports.findOne = function (query, collectionname, callback) {
    
	var collection = db.collection(collectionname);

    
	collection.findOne(query ,function (err, result) {
		if (err) {
			console.log("ERROR:", err);
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
	exports.findOne ({_id: mongojs.ObjectId(doc_id)}, collectionname, function (err, data) {
		callback(data);
	})
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
			console.log("COUNT:", count)
			callback(count.toString());
		}
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
			callback(err);
		} else {
			callback();
		}
	}); 
}


exports.updateSingle = function (collectionname, query, doc, callback) {

	var collection = db.collection(collectionname);

	collection.update(query, doc , {multi:false}, function (err, result) {
		if (err) {
			console.log(err);
			callback(err);
		} else {
			callback();
		}
	}); 
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
			console.log('Removed');
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

	collection.aggregate([

		// group by subtype
		{$group : {_id: {subtype:"$subtype", type:"$type"}, description : { $first: "$type_desc" },"nodes": {$push: {
			title:"$title",
            status:"$status",
			nodeid:"$nodeid",
			type:"$type",
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
	var field_name = "$" + node.params.in_field;
	var project = {};
	project[node.params.in_field] = 1;
	project["_id"] = 1;
	var project2 = { count:1, ids: 1, _id: 0 };
	project2[node.params.in_field] = "$_id";	// preserve original field name

	// we fist try group with array
	if(array) {
		collection.aggregate([
			{$project: project},
			{$unwind: field_name},
			{$group : {_id: field_name, count: {$sum:1}, "ids": {$push: "$_id"}}}, 
			{$project: { _id: 0, "name": "$_id", ids: 1, count:1 } },
			{$sort: { count: 1 }}
			// use $out for mongo 2.6 and newer
			],
			function (err, data) {
				if(err) {
					
					// did not work, try with non-array
					console.log("trying witn non-array");
					collection.aggregate([
						// {"$match": {"author":{"$ne": ""}} },
						{$project: project},
						{$group : {_id: field_name, count: {$sum:1}, "ids": {$push: "$_id"}}}, 
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
	} else {
		collection.aggregate([
			// {"$match": {"author":{"$ne": ""}} },
			{$project: project},
			{$group : {_id: field_name, count: {$sum:1}, "ids": {$push: "$_id"}}}, 
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
	}

}

// facet counts (double grouped also)
exports.facet = function (req, callback) {
	var col = require("../app/collection.js");
	var filters = [];
	var collection = db.collection(req.params.collection);
	var field = req.params.field;
	var filters = [];
	var group_by = null;
	var sort = {};
	var facet = "$facet";
	const AS_ARRAY = true;
	var skip = ["skip", "limit", "sort", "reverse", "op"]; 
	
	var operators = buildquery.operators(req);
	var filters = buildquery.filters(req, operators, skip, AS_ARRAY);

	var limit = parseInt(req.query.limit);
	if (limit < 0 || isNaN(limit))
		limit = 20;

	if(typeof req.query.sort !== 'undefined')  // by default sort by _id 
		sort[req.query.sort] = 1;
	else
		sort.count = -1;
		
	// algorithm for double grouped (match ,group, count)
	// - first match reference facets (journal/monografia)
	// - then match JYX-item facets (laitos, oppiaine, tyyppi, asiasana)
	// - then group by original source (JYX-item)
	
	// GROUP:
	if(req.params.groupby) {
		group_by = {
			$group: {
				_id:{mid:"$" + req.params.groupby}, 
				facet:{$first: "$" + field}
			}
		}
	} 
	
	if(!group_by)
		facet = "$" + field;

	// skip empty strings
	var empty = {};
	//empty[field] = {$ne:""};
		
	// check if field is array
	col.getKeyTypes(req.params.collection, function(res) {
		console.log("\nFACET QUERY:" + req.url);
		if(res[field] === "array") {
			var aggr = buildAggregate(facet, filters, group_by, empty, limit, sort, true);
			aggregate(collection, aggr, function(data) {
				callback(data);
			})
		} else {
			var aggr= buildAggregate(facet, filters, group_by, empty, limit, sort, false);
			aggregate(collection, aggr, function(data) {
				callback(data);
			})
		}
	})
}



function buildAggregate (facet, filters, group_by, empty, limit, sort, is_array) {

	var aggregate = [];
	// build aggregate
	if(filters.length)
		aggregate.push({$match: {$and:filters}});
	if(group_by)
		aggregate.push(group_by);
	if(is_array)
		aggregate.push({$unwind: facet});
	if(empty)
		aggregate.push({$match: empty});
	aggregate.push({$group : {_id: facet,count: { $sum: 1 }}});
	aggregate.push({$sort: sort});
	aggregate.push({$limit:limit});
	
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


exports.editProjectNode = function (doc_id, params, callback) {
	var collection = db.collection("mp_projects");
	var setter = {};
	setter.$set = createParamsObject("nodes", params);
	collection.update({"nodes._id":mongojs.ObjectId(doc_id)},setter, function (err, data) {callback(err,data);} )

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
	collection.find({}).sort({title:1}, function(err, docs) { callback(docs); });

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
		callback(err);
	});
}

exports.markNodeAsExecuted = function (node) {
	
}



// creates an object for mongoquery array update wiht positional operator ($)
function createParamsObject(arrayName, params) {
	
	var result = {};
	for (var p in params) {
		if( params.hasOwnProperty(p) ) {
		  result[arrayName + ".$." + p] =  params[p];
		} 
	}
	return result;
}



