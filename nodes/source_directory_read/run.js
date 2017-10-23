

if(context.error)
	out.say("error", "Error");

var file_objects = []; 
context.data.forEach(function(file, i) {
	var f = {}; 
	f.fullfile = file.file;
    f.basename = context.path.basename(file.file); 
    f.fullpath = context.path.dirname(file.file);
    f.size = file.size; 
    f.size_mt = Math.round(parseInt(file.size, 10)/10000)/100; 
    f.ctime = file.ctime; 
    f.ext = getExt(f.basename);
	f.relpath = f.fullpath.replace(context.node.params.root, "");
	f.rootpath = context.node.params.root;
    
    f[context.MP.source] = context.node._id; 
    file_objects.push(f); 
})

out.value = file_objects; 

function getExt (basename) {
	var base_split = basename.split(".");
	return base_split[base_split.length-1].toLowerCase();	
}
