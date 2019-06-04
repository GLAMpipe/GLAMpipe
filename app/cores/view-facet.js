

exports.createView = async function (node) {
	
	const fs = require("fs");
	const path = require("path");
	var p = __dirname.replace("app/cores","");
	console.log(node.project_dir);
	//var content = fs.readFileSync(path.join(dirName, fileName), 'utf-8')
	var html = fs.readFileSync(path.join(p, 'views', 'data', 'facet', 'index.html'))
	
	node.scripts.run.runInContext(node.sandbox);
	var data = "var config = " +JSON.stringify(node.sandbox.out.value, null, 4);
	console.log(data)
	console.log(global.config)
	return html;
}

exports.writeConfig = function (node, sandbox, cb) {
	var fs = require("fs");
	var path = require("path");

	var fsync = require('fs-sync');
	// copy html, css and js to node directory
	var p = __dirname.replace("node_runners","");
	var source = path.join(p, 'views', 'datapublic');
	fsync.copy(source, node.dir);
	
	// repare html and save index.html
	var html = fsync.read(path.join(p, 'views', 'dataviews', 'facet', 'index.html'))
	
	// change paths to same directory where index.html is
	html = html.replace(/\/publicview\//g, "");
	
	html = prepareHTML(html, node);
	fsync.write(path.join(node.dir, "index.html"), html);

	var file = path.join(node.dir, "facet_config.js");
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


exports.getFacetIndexHTML = function (req, res) {
	
	var fsync = require("fs-sync");
	var path = require("path");
	
	var node 	= require("./../../app/node.js");
	node.getNode(req.params.nodeid, function(err, node) {
		if(err) {
			console.log("FACET VIEW: node not found! nodeid = " + req.params.nodeid);
			return res.send("<h2>View not found!</h2>");
		}
		
		var p = __dirname.replace("node_runners","");
		var html = fsync.read(path.join(p, 'views', 'dataviews', 'facet', 'index.html'))
		
		if(fsync.exists(path.join(node.dir, 'facet_config.js')))
			var config = fsync.read(path.join(node.dir, 'facet_config.js'))
		else
			return res.send("<h2>You must run node first!</h2>");

		// we must override default config when viewing inside GLAMpipe
		html = html.replace("<!-- [CONFIG] -->", "<script>\n" + config + "</script>");
		html = prepareHTML(html, node);
		res.send(html);
	})
}
 
 
function prepareHTML (html, node) {
	var collection = node.collection.split("_");
	collection = collection[collection.length-1];
	html = html.replace("[GLAMPIPE]", global.config.publicUrl);
	html = html.replace("[PROJECT]", "<a href='" + global.config.publicUrl + "project/"+node.project+"'>" + node.project_title + "</a>");
	html = html.replace("[COLLECTION]", collection);
	if(node.settings.pageinfo) {
		html = html.replace("[PAGEINFO]", node.settings.pageinfo);
	}
	html = html.replace(/\[TITLE\]/g, node.settings.pagetitle);
	return html;
}
