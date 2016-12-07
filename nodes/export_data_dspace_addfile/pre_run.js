

// pre_run.js must provide an URL and bitstream object(s)
// example URL: http://demo.dspace.org/rest/items/b100008c-0895-4a3f-b85f-312fd43f2393/bitstreams

// simple getter since we don't know if input is array or string
function getVal (val) {
	if(Array.isArray(val))
		return val[0];
	return val;
}
var url = "http://demo.dspace.org/rest/items/b100008c-0895-4a3f-b85f-312fd43f2393/bitstreams";
var file = {};

file.filename = getVal(context.doc[context.node.settings.file]);

out.url = url;
out.value = file;
