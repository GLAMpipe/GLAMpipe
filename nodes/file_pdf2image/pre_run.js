var filenames = context.doc[context.node.params.in_field];
out.pre_value = null;
var paths = [];

if(Array.isArray(filenames)) {
	filenames.forEach(function(filename, index) {
		if(filename)
			paths.push(getPath(context.node.params.filepath, filename));
		else
			paths.push({});
	})
	
} else {
	if(filenames)
		paths.push(getPath(context.node.params.filepath, context.doc[context.node.params.in_field]));
	else
		paths.push({});
}

out.pre_value = paths;


function getPath(path, filename) {
	var page = getPageNumber();
    if(path)
        return {"page": page, "file": context.path.join(path, filename)};
    else
        return {"page": page, "file": filename};
        
}

function getPageNumber() {
	out.console.log(context.doc[context.node.params.out_page])
	if(context.doc[context.node.params.out_page])
		return context.doc[context.node.params.out_page]
	else
		return "0";
}
