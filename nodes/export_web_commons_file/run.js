if(context.error) { 
    out.say("error", context.error); 
    out.value = context.error; 
} else { 
    out.value = context.data.imageinfo.descriptionurl; 
}
            
context.counter++; 
            
/* check if user limit was reached */ 
if(parseInt(context.node.settings.limit) <= context.counter) { 
    out.say("finish", "All " + context.node.settings.limit + " done"); 
    context.abort = true; 
}
