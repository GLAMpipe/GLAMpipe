var mongojs 	= require('mongojs');
var async 		= require("async");
var mongoquery 	= require("../app/mongo-query.js");
var runswitch 	= require("../app/run-switch.js");


function finish (next) {
	next();
}


exports.run = function (projectId, gp, cb) {
		
	console.log("QUE: run all project nodes");
	
	var listener = function () {
		var self = this;
		this.next = null;
		this.setNext = function(next) {this.next = next;}
		this.finish = function (data) {
			console.log("TASK finished!")
			self.next();
		}
		this.progress = function (data) {
			console.log("SOCKET:", data);
		}
	}
	
	var l = new listener();
	// we listen our own websocket messages so that we 
	// TODO: this might be problematic with multiple users
	gp.wsClient.on('progress', l.progress);
	gp.wsClient.on('finish', l.finish);
	

		
	mongoquery.findOneById(projectId, "mp_projects", function(data) {
		console.log("PROJECT: running project", data.title);
		var nodes = sortNodes(data);
		console.log("NODE COUNT:", nodes.length);
		// run node once per record
		require("async").eachSeries(nodes, function iterator (node, next) {
			console.log("RUNNING node", node.nodeid);
			l.setNext(next);
			
			runswitch.runNode(node, gp.io);

		}, function done () {
			console.log("QUE: project executed")
			gp.wsClient.off('finish', l.finish);
			gp.wsClient.off('progress', l.progress);
		});
		
		//console.log(nodes);

		// if nodes are not executed before, they are run in creation order
		// if node are executed before, they are run in previous execution order
		
		cb({"status": "project run started", "project": data});
	});
}

function startQue () {
	
}

// group nodes per collection
function sortNodes (project) {

	var nodes = [];

	// we run nodes per collection
	project.collections.forEach(function(collection, i) {
		
		// find nodes for current collection 
		project.nodes.forEach(function(node, j) {
			if(node.collection == collection && node.type !== "collection") {
				nodes.push(node);
			}
		})
	})
	return nodes;
}
