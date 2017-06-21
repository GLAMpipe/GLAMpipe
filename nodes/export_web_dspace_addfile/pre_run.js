
/*
pre_run.js must provide an array of upload objects (item specific URL, file title and full file path)
example: 
* 
var test = { 
	url: "http://siljo.lib.jyu.fi:8080/rest/items/21c28eb0-43d4-4cbc-960c-71491d37915c/bitstreams",
	title:"mytest.png",
	filepath:"/home/arihayri/GLAMpipe-data/tmp/504086e41f54c8dd097e02895dffe951"
}
*/


var file = context.doc[context.node.settings.file];
var title = context.doc[context.node.settings.file_title];
var uuid = context.doc[context.node.settings.uuid];
var filepath = context.node.settings.file_path;

var output = [];

if(!filepath)
	filepath = "";

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

var url = context.node.params.url + "/items/" + uuid + "/bitstreams";
output.forEach(function(upload) {
	upload.url = url;
})

//out.console.log(output)
out.value = output;
