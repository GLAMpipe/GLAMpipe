
var upload = {};

upload.filepath = getFilePath(context.doc[context.node.params.in_field]);
upload.url = context.node.params.grobid_url + "/processReferences";

out.value = upload;

function getFilePath (filepath) {

	// filepath can be array -> we take first suitable one
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
