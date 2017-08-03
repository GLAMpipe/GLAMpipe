var filenames = context.doc[context.node.params.in_field];
out.pre_value = null;

if(Array.isArray(filenames)) {
	var paths = [];
	filenames.forEach(function(filename, index) {
		if(filename)
			paths.push(getPath(context.node.params.filepath, filename));
		else
			paths.push("");
	})
	out.pre_value = paths;
} else {
	if(filenames)
		out.pre_value = getPath(context.node.params.filepath, context.doc[context.node.params.in_field]);
	else
		paths.push("");
}


function getPath(path, filename) {
    if(path)
        return context.path.join(path, filename)
    else
        return filename;
        
}
