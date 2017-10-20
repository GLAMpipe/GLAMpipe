
var mongojs 	= require('mongojs');
var async 		= require("async");
var colors 		= require('ansicolors');
var path 		= require("path");
var flatten 	= require("flat");
const vm 		= require('vm');
var mongoquery 	= require("../app/mongo-query.js");
var buildquery 	= require("../app/query-builder.js");
var node 		= require("../app/node.js");
const MP 		= require("../config/const.js");
var exports 	= module.exports = {};

var exports = module.exports = {};

exports.getPipe = function(req, res) {

	res.json({msg: "pipe"});

}


exports.getReversePipe = function(req, res) {
	var current_node = {};
	node.getProjectByNode(req.params.node, function(err, project) {
		if(err)
			res.json({msg: err});
		else {
			project.nodes.forEach(function(node) {
				console.log(node._id)
				if(req.params.node == node._id)
					current_node = node;
			})
			
			if(current_node)
				res.json(reversePipe(project, current_node));
			else
				res.json({msg: "Node not found!"});
		}
	});
}

// get all nodes that that must be run before this node
function reversePipe(project, node_o) {
	var collection = node_o.collection;
	console.log(collection);
	var light_nodes = [];
	project.nodes.forEach(function(node) {
		if(collection == node.collection && node.type !== "collection" && node.type !== "source") {
			var lnode = {
				collection: node.collection,
				type: node.type,
				id: node._id,
				params: node.params,
				settings: node.settings
			}
			light_nodes.push(lnode)
		}
	})
	
	return light_nodes;
}
