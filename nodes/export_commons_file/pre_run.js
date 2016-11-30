var title = context.doc[context.node.params.field]; 
var source = context.doc[context.node.params.location]; 
            
/* if commons url is set, then skip that record */
if(context.get(context.doc, context.node.params.out_field) != "") { 
    out.say("progress", "skipping"); 
    context.skip = true; 
            
} else {
    var splitted = source.split("/"); 
    var filename = splitted[splitted.length -1]; 
    var s = filename.split(".");  
    var ext = s[s.length - 1]; 
    out.say("progress", "Starting to upload file <b>" + title + "</b>"); 
            
    if(title[title.length - 1] != ".") 
        out.title = title + "." + ext; 
    else
        out.title = title + ext; 
            
    out.filename = source; 
    out.wikitext = context.doc[context.node.params.wikitext]; 
}
