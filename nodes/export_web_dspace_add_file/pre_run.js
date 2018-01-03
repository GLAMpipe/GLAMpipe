
/*
pre_run.js must provide an *array* of upload objects (item specific URL, file title, full file path, out link and options)
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
			var upload = createUpload(filepath, f, title[i], i);
			checkOutLink(upload, out_link, file, i);
			if(upload)
				output.push(upload);
		})
	// file and title are strings
	} else {
		var upload = createUpload(filepath, file, title);
		checkOutLink(upload, out_link, file);
		if(upload)
			output.push(upload);
	}

	// options object for POST request
	var url = context.node.params.required_url + "/items/" + uuid + "/bitstreams";
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


function checkOutLink(upload, out_link, file, index) {
	
	var link = null;
	// if file is string, then possible out_link is first row in "out_link" array
	if(typeof file === "string" && Array.isArray(out_link))
		link = out_link[0];
	
	// if file is array, then possible out_link is nth row
	if(Array.isArray(file) && Array.isArray(out_link) && out_link[index])
		link = out_link[index];

	// if there is an url in out_link, then we do not run again
	if(link && typeof link == "string" && link.match(/^http/))
		upload.link = link;
}

function createUpload(filepath, file, title) {
	
	var link = "";
	
	var upload = {};
	if(!file || !title)
		return null;
		
	upload.file = filepath + file; // full file path
	upload.title = title;
	


	return upload;
}
