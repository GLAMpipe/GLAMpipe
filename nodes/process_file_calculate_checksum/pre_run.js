
var filenames = context.doc[context.node.params.in_field];

if(Array.isArray(filenames)) {
	var paths = [];
	filenames.forEach(function(filename) {
		paths.push(getPath(context.node.params.filepath, filename));
	})
	out.pre_value = paths;
} else {
	out.pre_value = getPath(context.node.params.filepath, context.doc[context.node.params.in_field]);
}


function getPath(path, filename) {
    if(path)
        return context.path.join(path, filename)
    else
        return filename;
        
}
