var path 		= require("path");

var MP = "__mp";
var datapath = "/home/arihayri/Documents/GLAMpipe_data";


var exports = module.exports = {};

exports.source =  MP + "_source";


exports.dataPath = function () {
	
	// check if we are running on OPENSHIFT
	
	if (typeof process.env.OPENSHIFT_DATA_DIR === "undefined")
		return datapath;
	else 
		return process.env.OPENSHIFT_DATA_DIR;

}

exports.projectsDir = function () {

	return path.join(exports.dataPath(), "projects");
}
