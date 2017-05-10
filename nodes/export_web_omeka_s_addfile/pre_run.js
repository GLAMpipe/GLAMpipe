
/*
pre_run.js must provide an array of upload objects (omeka item id, full file path)
*/


var file = context.doc[context.node.params.file];
var filepath = context.node.params.file_path;
var item = context.doc[context.node.params.in_field]; 
var uploads = [];
var output = [];

// filename can be on array or string
if(Array.isArray(file)) {
	file.forEach(function(f, i) {
		var upload = {item: item};
		upload.filepath = context.path.join(filepath, f); // full file path
		upload.item = item;
		if(Array.isArray(item)) // there should be only on item ID (omeka_id)
			upload.item = item[0];
		uploads.push(upload);
	})
} else {
	var upload = {};
	upload.filepath = context.path.join(filepath, file); // full file path
	uploads.push(upload);
}


uploads.forEach(function(upload) {
	var omekadata = {
		"o:ingester": "upload", 
		"file_index": "0", 
		"o:item": {"o:id": upload.item}
		}

	var options = {
		url: out.url,
		upload_field: "file[0]",
		data: omekadata,
		file: upload.filepath,
		headers: {
			"accept": "application/json"
		}
	};
	output.push(options);

})


out.pre_value = output;
