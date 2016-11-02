
// DATAPATH
// - where GLAMpipe can strore project data
// default: ""
var dataPath = "/home/arihayri/gp_aineistot";


// NODEPATH
// - where are GLAMpipe node files?
// default: "" (means that GP uses internal nodes)
var nodePath = ""; 


var MP = "__mp";

var exports = module.exports = {};

exports.source =  MP + "_source";
exports.loadNodesFromGithub = false;
exports.dataPath = dataPath;
exports.nodePath = nodePath;

