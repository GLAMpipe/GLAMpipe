
/*
pre_run.js must provide an *array* of upload objects (item specific URL, file title and full file path)
example: 
* 
var test = { 
	url: "http://siljo.lib.jyu.fi:8080/rest/items/21c28eb0-43d4-4cbc-960c-71491d37915c/bitstreams",
	title:"mytest.png",
	filepath:"/home/arihayri/GLAMpipe-data/tmp/504086e41f54c8dd097e02895dffe951"
}
*/

var file = context.doc[context.node.params.in_file];
var title = context.doc[context.node.params.in_file_title];
var uuid = context.doc[context.node.params.in_uuid];
var out_link = context.doc[context.node.params.out_link];
var filepath = context.node.params.file_path;




if(typeof uuid == "string" && context.validator.isUUID(uuid)) {

	var output = [];

	if(!filepath)
		filepath = "";

	// input can be array or string
	// we must pair filepaths and file titles
	if(Array.isArray(file) && Array.isArray(title)) {
		file.forEach(function(f, i) {
			var upload = createUpload(filepath, f, title[i]);
			if(upload)
				output.push(upload);
		})
	} else {
		var upload = createUpload(filepath, file, title);
		if(upload)
			output.push(upload);
	}

	var url = context.node.params.url + "/items/" + uuid + "/bitstreams";
	output.forEach(function(upload) {
		upload.options = {
			url: url + "?name=" + upload.title,
			jar:true,		// cookie jar on so that authentication works
			headers: {
				"accept": "application/json",
				"content-type": "multipart/form-data"
			}
		}
	})

	//out.console.log(output)
	out.pre_value = output;

} else {
	context.skip = true;
}


function createUpload(filepath, file, title) {
	var upload = {};
	if(!file || !title)
		return null;
		
	upload.file = filepath + file; // full file path
	upload.title = title;
		
	return upload;
}
