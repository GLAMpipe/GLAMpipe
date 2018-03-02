
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

	var project = "5988b5ef54defe0f75040fb7";
	var nodes = [];
	mongoquery.findOneById(project, "mp_projects", function(project) {
		project.nodes.forEach(function(node) {
			console.log(node._id)
			if(req.params.collection == node.collection && node.type !== "collection" && node.type !== "source") {
				node.outputs = getNodeOutputs(node);
				node.inputs = getNodeInputs(node);
				
				nodes.push(node);
				
			}
		})
		getRootNodes(nodes);
		res.json({msg: "pipe"});
	});
}

function getRootNodes(nodes) {
	// nodes that has no inputs that are listed in outputs of other nodes
	var rootNodes = [];
	nodes.forEach(function(node) {
		console.log("checking node " + node.title);
		console.log(node.inputs)
		var root = true;
		for(var i=0; i < nodes.length; i++) {
			node.inputs.forEach(function(input) {
				if(node._id != nodes[i]._id && nodes[i].outputs.includes(input))
					root = false;
			})
				
		}
		if(root)
			rootNodes.push(node);

	})
	console.log("ROOT nodes:")
	rootNodes.forEach(x=> console.log(x.settings))
	return rootNodes;
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
	
	return pipe(light_nodes, node_o);
	
	return light_nodes;
}

// check if nodes has 
function pipe(nodes, node_o) {
	var inputs = getNodeInputs(node_o);
	//return inputs;
	for(var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		console.log(node.id)
		console.log(node.params)
		if(node.id != node_o._id) {
			var outputs = getNodeOutputs(node);

			
			if(findOne(inputs, outputs))
				return node;
			//console.log(ip)
				//
		}
	}
}


function findOne(haystack, arr) {
	console.log("input" +haystack)
	console.log("---")
	console.log(arr)
	return arr.some(function (v) {
		return haystack.indexOf(v) >= 0;
	});
};

function getNodeInputs(node) {
	var inputs = [];
	for(var key in node.params) {
		if(/^in_/.test(key))
			inputs.push(node.params[key]);
	}
	for(var key in node.settings) {
		if(/^in_/.test(key))
			inputs.push(node.settings[key]);
		if(/_dynamic$/.test(key))
			inputs.push(node.settings[key]);
	}
	return inputs;
}

function getNodeOutputs(node) {
	var outputs = [];
	for(var key in node.params) {
		if(/^out_/.test(key))
			outputs.push(node.params[key]);
	}
	for(var key in node.settings) {
		if(/^out_/.test(key))
			outputs.push(node.settings[key]);
	}
	return outputs;
}
