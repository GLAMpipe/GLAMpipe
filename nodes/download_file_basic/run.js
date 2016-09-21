
// context.data is array of responses

var data = out.urls;
out.value = [];

if(data.constructor.name == "Array") {
	
	for (var i = 0; i < data.length; i++) {
		
		// dry run
		if(context.node.settings.dry_run) {
			if(data[i].error)
				out.value.push("dry run: " + data[i].error);
			else
				out.value.push("dry run: " + context.path.join(context.node.dir, data[i].filename));
			
		} else if(data[i].response) {
			
			out.say('progress', 'server said: ' + data[i].response.statusCode); 
			
			if(data[i].response.statusCode == 200) {
				out.say('progress', 'server said: ' + data[i].response.headers['content-type']); 
				var len = parseInt(data[i].response.headers['content-length'], 10); 
				var total = len / 1048576; 
				out.say('progress', 'Downloaded ' + total.toFixed(2) + ' Mt'); 
				
				out.value.push(context.path.join(context.node.dir, data[i].filename)); 
				context.node.download_counter++;	
				
			} else {
				out.say('error', 'Downloaded failed:' + data[i].url); 
				out.value.push("[error:" + data[i].response.statusCode + "]:" + data[i].url); 
			}

			
		} else if (data[i].error) {
			//out.say('progress', 'download failed: '  + data[i].error); 
			out.value.push("[error]: " + data[i].error);
			
		} else {
			out.value.push(undefined);
		}
	}
} 

