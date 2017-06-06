
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
		out.pre_value.push(download); 
	}
} else {
	var download = {};
	download.filename = generateFileName(input);
	download.url = context.base_url + input;
	out.pre_value.push(download);
}



function generateFileName (url, index) {

	var filename = "";

	// do not create file names for empty urls
	if(url == "")
		return "";

	// use last part of URL as a filename 
	if (c.node.settings.filename_type == "url") {  
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
	if(index)
		filename += "_" + index;

	/* static file extension */ 
	if (c.node.settings.file__ext && c.node.settings.file__ext.trim() != "") {
		var ext = c.node.settings.file__ext.replace(".", ""); 
		filename += "." + ext; 
	}

	// some sensible max length 
	if(filename.length > 250) {
		filename = filename.substring(0,250);
	}

	/* fallback */ 
	if (filename == "" || filename == null || typeof filename !== "string") 
		filename = c.count.toString(); 
	


	/* remove characters that might confuse OS */ 
	return filename.replace(/[\.-/, \\]/g, "_").trim().toLowerCase(); 
	 
		
}
