
var filenames = context.doc[context.node.params.in_field];

// make sure that file path is not "undefined"
if(!context.node.params.filepath)
	context.node.params.filepath = "";

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
