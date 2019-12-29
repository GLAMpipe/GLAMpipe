
var Node 		= require('./new_node.js');


module.exports = async function (options, callback) {
	var node = new Node();
	await node.loadFromProject(options.id);
	await node.run(options);
	callback(null, {options: options, project: node.project, id: node.uuid, pid: process.pid})
}
