
// TODO: not very smart if input has multiple urls in array

var c = context; 
var input = context.doc[context.in_field];
out.urls = [];

if(input.constructor.name == "Array") {
	for (var i = 0; i < input.length; i++) {
		var download = {};
		download.filename = generateFileName(input, i);		
		download.url = context.base_url + input[i];
		out.urls.push(download); 
	}
} else {
	var download = {};
	download.filename = generateFileName();
	download.url = context.base_url + input;
	out.urls.push(download);
}



function generateFileName (input, index) {

	var filename = "";

	// do not create file names for empty input
	if(input[i] == "")
		return "";

	/* create file name */ 
	if (c.node.params.filename_type == "url") {  
		var split = input[i].split("/"); 
		filename = split[split.length-1]; 

	} else if (c.node.params.filename_type == "record") {  
		filename = c.get(c.doc, c.node.params.filename__record); 

	// TODO: maybe one could use language codes here, like title in english
	} else if (c.node.params.filename_type == "own") {  
		filename = c.node.params.file__1; 
		filename += c.get(c.doc, c.node.params.file__2); 
		filename += c.node.params.file__3; 
		filename += c.get(c.doc, c.node.params.file__4); 
		filename += c.node.params.file__5; 
		filename += c.get(c.doc, c.node.params.file__6); 
		if(c.node.params.counter == "yes") 
		   filename += c.count; 
	}

	// if input is array with more than one items, then we must add index to filename
	if(input && input.length > 1)
		filename += "_" + index;

	/* static file extension */ 
	if (c.node.params.file__ext != "") {
		var ext = c.node.params.file__ext.replace(".", ""); 
		filename += "." + ext; 
	}

	// some sensible max length 
	if(filename.length > 120) {
		filename = filename.substring(0,120);
	}

	/* fallback */ 
	if (filename == "") 
		filename = c.count; 
	


	/* remove characters that might confuse OS */ 
	return filename.replace(/[\/]\,\./g, "_"); 
	 
		
}
