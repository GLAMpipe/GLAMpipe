
var recursive   = require('recursive-readdir');
var path        = require('path');
var fs        	= require('fs');
var mongoquery 	= require("../../app/mongo-query.js");
const MP 		= require("../../config/const.js");

exports.read = function  (node, sandbox, io) {




	function scan (ignore) { 
		recursive(node.params.root, [ignore], function (err, files) {
			if(err) {
				if(err.code == "ENOENT") {
					console.log("ERROR: directory not found", node.params.root);
					io.sockets.emit("error", "directory not found: " + node.params.root);
				} else
					console.log(err);
				return;
			} 
			
			// compose file data and give it to node for processing
			
			var file_objs = [];
			require("async").eachSeries(files, function iterator (file, next) {
				fs.stat(file, function(err, stats) {
					
					var f = {
						file: file,
						size: stats["size"],
						ctime: stats["ctime"]
					}
					file_objs.push(f);
					next();
				})
			
			}, function done () {
				//sandbox.finish.runInContext(sandbox);
				sandbox.context.data = file_objs;
				sandbox.run.runInContext(sandbox);

				// insert
				if(sandbox.out.value.length > 0) {
					mongoquery.insert(node.collection, sandbox.out.value, function(err, result) {
						sandbox.finish.runInContext(sandbox);
						console.log("DONE");
					});
				} else {
					console.log("None found");
				}
					console.log(file_objs);
				});
		
			

		});
	}
	
	// remove previous data insertet by node and import file
	var query = {}; 
	query[MP.source] = node._id;

	mongoquery.empty(node.collection, query, function() {
		var exts = node.settings.include_ext.toLowerCase();
		exts = exts.replace(/[\s\.]/g, ""); 
		
		if(exts != "") {
			var ext_arr = exts.split(",");
			
			// ignore function if wanted extensions are provided
			var ignore = function (file, stats) {
				var base_split = path.basename(file).split(".");
				var ext = base_split[base_split.length-1].toLowerCase();
				if (ext_arr.indexOf(ext) === -1 && stats.isFile())
					return true;
				else 
					return false;
			}
			
			scan(ignore);
			
		} else {
			
			// ignore function that does not ignore anyone
			var ignore = function (file, stats) {
				return false;
			}
			
			scan(ignore);
		}
	});
}


