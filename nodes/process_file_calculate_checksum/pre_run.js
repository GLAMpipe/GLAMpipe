
var filenames = context.doc[context.node.params.in_field];

if(Array.isArray(filenames)) {
	var paths = [];
	filenames.forEach(function(filename) {
		paths.push(context.path.join(context.node.params.filepath, filename));
	})
	out.pre_value = paths;
} else {
	out.pre_value = context.path.join(context.node.params.filepath, context.doc[context.node.params.in_field]);
}
