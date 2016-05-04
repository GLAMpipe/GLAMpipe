var path 		= require("path");
var mongoquery 	= require("../app/mongo-query.js");

var MP = "__mp";
var datapath = "/home/arihayri/Documents/GLAMpipe_data";


var exports = module.exports = {};

exports.source =  MP + "_source";


exports.dataPath = function (glampipe) {
	
	// if we are not running on OPENSHIFT
	if (typeof process.env.OPENSHIFT_DATA_DIR === "undefined") {
		// then use datapath from "mp_settings" collection
		return datapath;
		
	// else use OPENSHIFT data dir
	} else 
		return process.env.OPENSHIFT_DATA_DIR;

}

exports.projectsDir = function () {

	return path.join(exports.dataPath(), "projects");
}
