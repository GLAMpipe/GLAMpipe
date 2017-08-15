
// context.data is array of responses

var data = context.data;
out.value = "";
out.setter = {};
out.setter[context.node.params.out_field] = "";




// dry run
if(context.node.settings.dry_run) {
	if(data.error)
		out.setter[context.node.params.out_field] = "dry run: " + data.error;
	else
		out.setter[context.node.params.out_field] = "dry run: " + context.path.join(context.node.dir, data.filename);
	
} else if(data.response) {
	
	out.say('progress', 'server said: ' + data.response.statusCode); 
	
	if(data.response.statusCode == 200) {
		out.say('progress', 'server said: ' + data.response.headers['content-type']); 
		var len = parseInt(data.response.headers['content-length'], 10); 
		var total = len / 1048576; 
		out.say('progress', 'Downloaded ' + total.toFixed(2) + ' Mt'); 
			
		out.setter[context.node.params.out_field] = context.path.join(context.node.dir, data.filename); 
		out.setter[context.node.params.out_ext] = "";
		out.setter[context.node.params.out_mime] = "";
		
		if(data.filetype && data.filetype.ext) {
			out.setter[context.node.params.out_ext] = data.filetype.ext; 
		}
		if(data.filetype && data.filetype.mime) {
			out.setter[context.node.params.out_mime] = data.filetype.mime; 
		}
		
		context.node.download_counter++;	
		
	} else {
		//out.say('error', 'Downloaded failed:' + data.url); 
		out.setter[context.node.params.out_field] = out.error_marker + data.response.statusCode + "]:" + data.url; 
	}

	
} else if (data.error) {
	//out.say('progress', 'download failed: '  + data.error); 
	// if file exists, then we just output the filepath
	if(data.error === "file exists") 
		out.setter[context.node.params.out_field] = data.filepath;
	else
		out.setter[context.node.params.out_field]  = out.error_marker + data.error;
	
} 

