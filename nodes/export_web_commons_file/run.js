var apis = ["commons.wikimedia.beta.wmflabs.org", "commons.wikimedia.org"]; 

if(context.error) { 
    out.say("error", context.error); 
    out.value = context.error; 
    
// if page exists, then write the url to output
} else if(context.data && context.data.pageexists) {
	var server = "https://" + apis[parseInt(context.node.settings.api)];  
	out.value = server + "/wiki/File:" + context.data.pageexists;
	
// else write new url to output
} else if(context.data && context.data.imageinfo) { 
    out.value = context.data.imageinfo.descriptionurl; 
}
            
context.counter++; 
            
/* check if user limit was reached */ 
if(parseInt(context.node.settings.limit) <= context.counter) { 
    out.say("finish", "All " + context.node.settings.limit + " done"); 
    context.abort = true; 
}
