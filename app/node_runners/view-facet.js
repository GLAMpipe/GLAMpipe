

exports.writeConfig = function (node, sandbox, cb) {
	var fs = require("fs");
	var path = require("path");

	var fsync = require('fs-sync');
	// copy html, css and js to node directory
	var source = "/home/arihayri/projects/GLAMpipe/app/views/dataviews/facet";
	fsync.copy(source, node.dir);

	var file = path.join(node.dir, "config.js");
	sandbox.run.runInContext(sandbox);
	var data = "var config = " +JSON.stringify(sandbox.out.value, null, 4);

	fs.writeFile(file, data, function(error) {
		 if (error) {
		   console.error("write error:  " + error.message);
		 } else {
		   console.log("Successful Write to " + file);
		   sandbox.finish.runInContext(sandbox);
		 }
	});

}
