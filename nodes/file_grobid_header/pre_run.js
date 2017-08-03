
var upload = {};

upload.filepath = getFilePath(context.doc[context.node.params.in_field]);
upload.url = context.node.params.grobid_url + "/processHeaderDocument";

out.value = upload;

function getFilePath (filepath) {

	// even if filepath is array we will process only one file -> we take first suitable one
	if(Array.isArray(filepath)) {
		for (var i = 0; i < filepath.length; i++) {
			if(typeof filepath[i] === "string" && filepath[i] != "" && filepath[i].indexOf("[error]") === -1) {
				return filepath[i];
			}
		}
	} else {
		return filepath;
	}
}
