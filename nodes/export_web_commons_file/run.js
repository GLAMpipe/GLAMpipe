var apis = ["commons.wikimedia.beta.wmflabs.org", "commons.wikimedia.org"]; 
out.value = "";


if(context.error) { 
    out.say("error", context.error); 
    out.value = out.error_marker + context.error; 
    
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
