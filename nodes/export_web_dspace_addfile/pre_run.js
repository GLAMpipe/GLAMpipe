
/*
pre_run.js must provide an array of upload objects (item specific URL, file title and full file path)
example: 
{ 
	url: https://demo.dspace.org/rest/items/b100008c-0895-4a3f-b85f-312fd43f2393/bitstreams,
	title:"mytest.png",
	filepath:"/home/me/images/mytest.png"
}
*/


var file = context.doc[context.node.settings.file];
var title = context.doc[context.node.settings.file_title];
var uuid = context.doc[context.node.settings.uuid];
var filepath = context.node.settings.file_path;

var output = [];

// input can be array or string
// we must pair filepaths and file titles
if(Array.isArray(file) && Array.isArray(title)) {
	file.forEach(function(f, i) {
		var upload = {};
		upload.filepath = filepath + f; // full file path
		if(title[i] && title[i] !== "")
			upload.title = title[i];
		else
			out.error = "Number of files and file names do not match!";
			
		output.push(upload);
	})
} else {
	var upload = {};
	upload.filepath = filepath + file; // full file path
	if(title && title !== "")
		upload.title = title;
	else
		out.error = "No file title found!";
		
	output.push(upload);
}

var url = context.node.params.dspace_url + "/items/" + uuid + "/bitstreams";
output.forEach(function(upload) {
	upload.url = url;
})

out.value = output;
