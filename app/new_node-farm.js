
var db 			= require('./db.js');
var Node 		= require('./new_node.js');


module.exports = async function (options, callback) {
	var node = new Node();
	await node.loadFromProject(options.id);
	await node.run(options);
	callback(null, ' GP-NODE-FARM (' + process.pid + ')')
}
