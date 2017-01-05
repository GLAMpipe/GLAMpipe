
var mongojs = require('mongojs');
var async = require("async");
var database = require('../config/database');

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
			console.log('inserted to', collectionname);
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
			callback({status:'ok'});
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
				if(err)
					console.log(err);
				callback(data);
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

exports.facetGroupBy = function (req, callback) {
	var filters = [];
	var collection = db.collection(req.params.id);
	field = "$" + req.params.field;
	var aggregate = [];
	var matches =[];
	var filter_fields = [];
	
	filters.forEach(function(filter) {
		if(filter === "") return; // skip empty
		var filter_split = filter.split(":");
		var field_name = filter_split[0];
		var filter_params = filter_split[1].split(",");
		var f = {};
		f[field_name] = {"$all":filter_params};
		matches.push(f);
		filter_fields.push(field_name);
		console.log(f);
	});

	// we must include all filter fields in aggregation
	
	// group by this field
	if(req.params.group) {
		var groupBy = {
			$group: {
				_id:{mid:"$id"}, 
				facet:{$first: field}
			}
		}
		//filter_fields.forEach(function(fiel) {
			//groubBy.$group[field] = {};
		//})
		aggregate.push(groupBy);
	} 
	
	if(req.query.filter)
		filters = req.query.filter.split(";");
	

	//console.log(matches);
	
	if(!matches.length)
		var match = {$match: {}};
	else
		var match = {$match: {$and:matches}};

	// remove empties
	var empty_match = {};
	empty_match[req.params.field] = {$ne:""};
	
	aggregate.push({$unwind:"$facet"});
	aggregate.unshift(match);
	aggregate.push({$group : {_id:{id:"$facet"},count: { $sum: 1 }}});
	aggregate.push({$sort: { count: -1 }});

	console.log(aggregate);

	collection.aggregate(
		aggregate
	
		// use $out for mongo 2.6 and newer
		,
		function (err, data) {
			if(err) {
				console.log(err);
				// let's try non-array version
				collection.aggregate([
					match,
					{$match: empty_match},
					{$group : {_id: field, count: {$sum:1}}}, 
					{$sort: { count: -1 }}
					// use $out for mongo 2.6 and newer
					],
					function (err, data) {
						if(err) {
							console.log("ERRRRROOOOR");
							callback(data);
						} else {
							callback(data);
						}
					}
				)
			} else {
				callback(data);
			}
		}
	) 
}



exports.facetTest = function (req, callback) {
	var filters = [];
	var collection = db.collection(req.params.id);



	console.log(collection);
	console.log("asdf");

	collection.aggregate(
		{$match:{
			"gr_teoksessa":{$all:["Computers & Education"]}
			
			}
		},
		
		{$group: 
			{_id:"$id",
			facet:{$first:"$dc_contributor_laitos__splitted"},
			}
		},
		{$unwind:"$facet"},
		{$group: 
			{_id:"$facet",
			count:{$sum:1},
			}
		}
	
		// use $out for mongo 2.6 and newer
		,
		function (err, data) {
			if(err) {
				console.log(err);
				callback(data);

			} else {
				callback(data);
			}
		}
	) 
}


exports.facet = function (req, callback) {
	var filters = [];
	var collection = db.collection(req.params.id);
	field = "$" + req.params.field;
	var aggregate = [];
	groupBy = null;
	console.log(req.query.groupby);
	
	// group by this field
	if(req.query.groupby) {
		groupBy = {
			$group: {
				_id:{mid:"$id"}, 
				laitos:{$first:"$dc_contributor_laitos__splitted"}
			}
		}
		aggregate.push(groupBy);
	} 
	
	if(req.query.filter)
		filters = req.query.filter.split(";");
	
	var matches =[];
	filters.forEach(function(filter) {
		if(filter === "") return; // skip empty
		var filter_split = filter.split(":");
		var field_name = filter_split[0];
		var filter_params = filter_split[1].split(",");
		var f = {};
		f["laitos"] = {"$all":filter_params}
		matches.push(f);
		console.log(f);
	});
	//console.log(matches);
	
	if(!matches.length)
		var match = {$match: {}};
	else
		var match = {$match: {$and:matches}};

	// remove empties
	var empty_match = {};
	empty_match[req.params.field] = {$ne:""};
	
	aggregate.push({$unwind:"$laitos"});
	aggregate.push(match);
	aggregate.push({$group : {_id:{id:"$laitos"},count: { $sum: 1 }}});
	aggregate.push({$sort: { count: -1 }});

	collection.aggregate(
		aggregate
	
		// use $out for mongo 2.6 and newer
		,
		function (err, data) {
			if(err) {
				console.log(err);
				// let's try non-array version
				collection.aggregate([
					match,
					{$match: empty_match},
					{$group : {_id: field, count: {$sum:1}}}, 
					{$sort: { count: -1 }}
					// use $out for mongo 2.6 and newer
					],
					function (err, data) {
						if(err) {
							console.log("ERRRRROOOOR");
							callback(data);
						} else {
							callback(data);
						}
					}
				)
			} else {
				callback(data);
			}
		}
	) 
}


exports.filtered = function (req, callback) {
	
	// filtered search
	
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



