
// DATAPATH
// - where GLAMpipe can strore project data
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
var isServerInstallation = true;

var exports = module.exports = {};


exports.source =  MP + "_source";
exports.loadNodesFromGithub = false;
exports.dataPath = dataPath;
exports.nodePath = nodePath;
exports.isServerInstallation = isServerInstallation;

