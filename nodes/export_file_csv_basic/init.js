
var fields = [];
if(context.node.settings.fields) {
	for(var field in context.node.settings.fields) {
		if(context.node.settings.fields[field] == "true")
			fields.push(field);
	}
}

out.csvheaders = fields;

