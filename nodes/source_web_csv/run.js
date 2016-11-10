
var download = out.urls[0];

out.say('progress', 'server said: ' + download.response.statusCode); 

if(download.response.statusCode == 200) {
	out.say('progress', 'server said: ' + download.response.headers['content-type']); 
	var len = parseInt(download.response.headers['content-length'], 10); 
	var total = len / 1048576; 
	out.say('progress', 'Downloaded ' + total.toFixed(2) + ' Mt'); 
	
	//out.value.push(context.path.join(context.node.dir, download.filename)); 
	context.node.download_counter++;	
	
} else {
	out.say('error', 'Downloaded failed:' + download.url); 
	//out.value.push("[error:" + download.response.statusCode + "]:" + download.url); 
}

