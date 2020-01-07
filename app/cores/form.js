
exports.create = async function (node) {
	
	const fs = require("fs-extra");
	const path = require("path");
	var source = path.join(node.source.source_dir, 'files');
	var target = path.join(node.source.project_dir, 'files');
	
	// copy 'files' directory from node source to node's project directory (html + css + js)
	await fs.copy(source, target);
	
	var html = await fs.readFile(path.join(node.source.source_dir, 'files', 'index.html'), 'utf-8')
	html = prepareHTML(html, node)
	await fs.writeFile(path.join(target, 'index.html'), html)
	
	// create config.js and write it to node's project directory
	node.scripts.process.runInContext(node.sandbox);
	await fs.writeFile(path.join(target, 'js', 'config.js'), 'var config = ' + JSON.stringify(node.sandbox.out.value, null, 4))
	
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
	html = html.replace(/\[VIEWPATH\]/g, '/views/' + node.uuid);
	return html;
}
