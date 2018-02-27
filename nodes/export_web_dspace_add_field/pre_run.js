

var metafield = {};
var schema = "";
var field = getVal(context.doc[context.node.settings.metadatafield]);

var options = {
	json: metafield,
	jar:true
};

var splitted = field.split(".");
if(splitted.length === 2) {
	schema = splitted[0];
	metafield.element = splitted[1];
} else if(splitted.length === 3) {
	schema = splitted[0];
	metafield.element = splitted[1];
	metafield.qualifier = splitted[2];	
} 

metafield.description = getVal(context.doc[context.node.settings.description]);

options.url = context.node.params.required_url + "/registries/schema/" + schema + "/metadata-fields";
out.pre_value = options;



// simple getter since we don't know if input is array or string
function getVal (val) {
	if(Array.isArray(val))
		return val[0];
	return val;
}
