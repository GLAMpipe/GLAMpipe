
// context.data is array of responses

var data = context.data;
out.value = "";



// dry run
if(context.node.settings.dry_run) {
	if(data.error)
		out.value = "dry run: " + data.error;
	else
		out.value = "dry run: " + context.path.join(context.node.dir, data.filename);
	
} else if(data.response) {
	
	out.say('progress', 'server said: ' + data.response.statusCode); 
	
	if(data.response.statusCode == 200) {
		out.say('progress', 'server said: ' + data.response.headers['content-type']); 
		var len = parseInt(data.response.headers['content-length'], 10); 
		var total = len / 1048576; 
		out.say('progress', 'Downloaded ' + total.toFixed(2) + ' Mt'); 
		
		out.value = context.path.join(context.node.dir, data.filename); 
		context.node.download_counter++;	
		
	} else {
		//out.say('error', 'Downloaded failed:' + data.url); 
		out.value = out.error_marker + data.response.statusCode + "]:" + data.url; 
	}

	
} else if (data.error) {
	//out.say('progress', 'download failed: '  + data.error); 
	// if file exists, then we just output the filepath
	if(data.error === "file exists") 
		out.value = data.filepath;
	else
		out.value = out.error_marker + data.error;
	
} else {
	out.value = undefined;
}

