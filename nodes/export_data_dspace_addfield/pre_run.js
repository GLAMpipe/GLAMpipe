
// simple getter since we don't know if input is array or string
function getVal (val) {
	if(Array.isArray(val))
		return val[0];
	return val;
}

var metafield = {};
var schema = getVal(context.doc[context.node.settings.schema]);

metafield.name = getVal(context.doc[context.node.settings.name]);
metafield.element = getVal(context.doc[context.node.settings.element]);
metafield.description = getVal(context.doc[context.node.settings.description]);

out.url = context.node.settings.url + "/registries/schema/" + schema + "/metadata-fields";
out.value = metafield;
