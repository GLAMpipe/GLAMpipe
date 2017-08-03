
// Node creates an array of download objects {url:, filename:}

// TODO: not very smart if input has multiple urls in array

var c = context; 
var input = context.doc[context.in_field];

out.pre_value = [];

if(Array.isArray(input)) {
	for (var i = 0; i < input.length; i++) {
		var download = {};
		download.filename = generateFileName(input[i], i);	
		out.console.log(download.filename);	
		download.url = context.base_url + input[i];
		previousFile(download, i);
		out.pre_value.push(download); 
	}
} else {
	var download = {};
	download.filename = generateFileName(input, null);
	download.url = context.base_url + input;
	previousFile(download, null);
	out.pre_value.push(download);
}


function previousFile(download, index) {
	var output = context.doc[context.node.params.out_field];
	// if "out_field" has value, then we use that instead of generated filename
	// reason for this is that when we use dynamic file extension as part of the file,
	// we cannot generate proper filename before we have actually downloaded the file
	if(index != null && Array.isArray(output)) {
		if(output[index] && output[index] != "")
			download.previous = output[index];
	} else {
		if(Array.isArray(output) && output[0] != "") {
			download.previous = output[0];
		}
	}
	
}


function generateFileName (url, index) {

	var filename = "";

	// do not create file names for empty urls
	if(url == "")
		return "";

    // use document id as filename
    if (c.node.settings.filename_type == "id") { 
        filename = c.doc._id.toString();

	// use last part of URL as a filename 
	} else if (c.node.settings.filename_type == "url") {  
		var split = url.split("/"); 
		filename = split[split.length-1]; 

	// use document field as a filename
	} else if (c.node.settings.filename_type == "record") {  
		filename = c.get(c.doc, c.node.settings.filename__record); 
		out.console.log("uuid:" + filename)
		out.console.log(c.node.settings.filename__record)

	// construct filaname from multiple fields
	// TODO: maybe one could use language codes here, like title in english
	} else if (c.node.settings.filename_type == "own") {  
		filename = c.node.settings.file__1; 
		filename += c.get(c.doc, c.node.settings.file__2); 
		filename += c.node.settings.file__3; 
		filename += c.get(c.doc, c.node.settings.file__4); 
		filename += c.node.settings.file__5; 
		filename += c.get(c.doc, c.node.settings.file__6); 
		if(c.node.settings.counter == "yes") 
		   filename += c.count; 
	}

	// if input is array with more than one items, then we must add index to filename
	if(index != null)
		filename += "_" + index;

	// some sensible max length 
	if(filename.length > 250) {
		filename = filename.substring(0,250);
	}

	/* fallback */ 
	if (filename == "" || filename == null || typeof filename !== "string") 
		filename = c.count.toString(); 


	/* remove characters that might confuse OS */ 
	filename = filename.replace(/[\.-/, \\]/g, "_").trim().toLowerCase(); 

	/* static file extension */ 
	if (c.node.settings.file__ext && c.node.settings.file__ext.trim() != "") {
		var ext = c.node.settings.file__ext.replace(".", ""); 
		filename += "." + ext; 
	}
	
	return filename;
		
}
