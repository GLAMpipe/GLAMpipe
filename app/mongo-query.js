
var mongojs = require('mongojs');
var async = require("async");
var database = require('../config/database');

var db = mongojs(database.url);
var exports = module.exports = {};


// *********************************************************************
// ******************************* FIND  *******************************
// *********************************************************************

exports.findAll = function (params, callback) {
	var collection = db.collection(params.collection);
	var sort = {};
	sort[params.sort] = 1;
	//collection.count(function(err, docs) {console.log("COUNT:", docs)});
	collection.find({}).sort(sort).limit(params.limit).skip(params.skip, function(err, docs) { callback(docs); });
}

exports.find2 = function (query, collectionname, callback) {

	var collection = db.collection(collectionname);
	collection.find(query, function (err, result) {
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
			console.log(err);
			callback({'error':err})
		} else {
			callback(result);
		}
	});   
}


exports.findOneById = function (doc_id, collectionname, callback) {
	exports.findOne ({_id: mongojs.ObjectId(doc_id)}, collectionname, function (data) {
		callback(data);
	})
}

exports.count = function (collectionname, query, callback) {

	var collection = db.collection(collectionname);

	collection.count(query ,function (err, result) {
		if (err) {
			console.log(err);
			callback({'error':err})
		} else {
			callback(result);
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

	var collection = db.collection('mp_projects');

	collection.insert(doc ,function (err, result) {
		if (err) {
			console.log(err);
			callback({'error':err})
		} else {
			console.log('Inserted');
			callback();
		}
	}); 
}


exports.insert = function (collectionname, doc, callback) {

	var collection = db.collection(collectionname);

	collection.insert(doc ,function (err, result) {
		if (err) {
			console.log(err);
			callback({'error':err})
		} else {
			//console.log('inserted to', collectionname);
			callback({});
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

	collection.update(query, doc ,function (err, result) {
		if (err) {
			console.log(err);
			callback({'error':err})
		} else {
			callback();
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
	exports.findOne(query, "mp_projects", function(msg) {callback(msg)} );
}

exports.getFunc = function (id, callback) {
	console.log('getFunc called for func ',id );
	var query = {"_id":mongojs.ObjectId(id)};
	exports.findOne(query, 'functions', function(msg) {callback(msg)} );
}

exports.getSource = function (id, callback) {
	console.log('getSource called ',id );
	var query = {"_id":mongojs.ObjectId(id)};
	exports.findOne(query, 'sources', function(msg) {callback(msg)} );
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



