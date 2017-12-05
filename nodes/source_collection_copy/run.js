


var params = context.node.params;
var settings = context.node.settings;
var output = {};


// copy only selected fields
if(context.node.settings.fields) {
	for(var field in context.node.settings.fields) {
		if(context.node.settings.fields[field] == "true")
			output[field] = context.doc[field];
	}
}


out.value = output;


