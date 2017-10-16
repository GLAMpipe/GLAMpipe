
/*
pre_run.js must provide an array of options for request-module 
*/


var file = context.doc[context.node.params.in_file];
var filepath = context.node.params.file_path;
var item_link = context.doc[context.node.params.in_field]; 
var out_link = context.doc[context.node.params.out_field]; 
var uploads = [];
var output = [];

// if there is an url in out_link, then we do not run again
//if(out_link && typeof out_link == "string" && out_link.match(/^http/))
	//context.skip = true;

function isUploaded(index) {
	if(Array.isArray(out_link) && out_link[index] && typeof out_link[index] == "string" && out_link[index].match(/^http/)) {
		out.console.log("on jooooooooooooooo")
		return true;
	} else {
		return false;
	}
}

// Omeka ID for files is in the form of link e.g. http://localhost:8080/admin/item/21 
// We need to extract the last part and check that it is an integer
var link_part = item_link.split("/");
var item = link_part[link_part.length-1];

// item id must be an integer
if(parseInt(item) && file) {

	// filename can be on array or string
	if(Array.isArray(file)) {
		file.forEach(function(f, i) {
			var upload = {item: item};
			upload.file = context.path.join(filepath, f); // full file path
			upload.item = item;
			if(Array.isArray(item)) // there should be only on item ID (omeka_id)
				upload.item = item[0];
			
			if(isUploaded(i))
				upload.link = out_link[i];
				
			uploads.push(upload);
		})
	} else {
		var upload = {};
		upload.file = context.path.join(filepath, file); // full file path
		
		if(isUploaded(0))
			upload.link = out_link[0];
		
		uploads.push(upload);
	}


	uploads.forEach(function(upload) {
		var omekadata = {
			"o:ingester": "upload", 
			"file_index": "0", 
			"o:item": {"o:id": upload.item}
			}
		upload.upload_field = "file[0]";
		
		upload.options = {
			url: out.url,
			data: omekadata,
			headers: {
				"accept": "application/json"
			}
		};
		//output.push(options);

	})
}


out.pre_value = uploads;
