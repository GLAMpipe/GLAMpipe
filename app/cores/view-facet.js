

exports.createView = async function (node) {

	const fs = require("fs-extra");
	const path = require("path");

	var target = path.join(node.source.project_dir, 'public');
	await fs.ensureDir(path.join(target, 'js')) // this the place for config.js

	// create config.js and write it to node's project directory
	node.scripts.process.runInContext(node.sandbox);
	await fs.writeFile(path.join(target, 'js', 'config.js'), 'var config = ' + JSON.stringify(node.sandbox.out.value, null, 4))

}
