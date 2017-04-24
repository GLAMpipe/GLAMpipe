
// DATAPATH
// - where GLAMpipe can strore project data on *non-docker* installation
// default: ""
var dataPath = "/home/arihayri/GLAMpipe-data";


// NODEPATH
// - where are GLAMpipe node files?
// default: "" (means that GP uses internal nodes)
var nodePath = ""; 


var MP = "__mp";

// MODE (server/desktop)
// - false = do not use authentication
// - true = use local authentication
var isServerInstallation = false;
var canRegister = true;

var url = "http://localhost";

// IP passes
// one can define IPs that are allowed to execute certain API paths
var IP_passes = [
	{
		path: "/api/v1/collections/p15_admin-embargopyynnt_c0_requests/", 
		method: "PUT", 
		ip:"127.0.0.1",
		label: "embargo-pyynnöt"
	}
]

var exports = module.exports = {};


exports.source =  MP + "_source";
exports.loadNodesFromGithub = false;
exports.dataPath = dataPath;
exports.nodePath = nodePath;
exports.url = url;
exports.isServerInstallation = isServerInstallation;
exports.canRegister = canRegister;
exports.IP_passes = IP_passes;

