
var out_field_value = context.get(context.doc, context.node.params.out_field);

// if there is an url in the output field, then we skip whole sequence
if(out_field_value.match(/^http/))
	context.skip = true;
