var title = context.doc[context.node.params.field]; 
var source = context.doc[context.node.params.location]; 

// checksum test
if(Array.isArray(context.doc[context.node.params.checksum_result]))
	var file_check = context.doc[context.node.params.checksum_result][0];
else
	var file_check = context.doc[context.node.params.checksum_result];
            
/* if commons url is set, then skip that record */
if(context.get(context.doc, context.node.params.out_field) != "" ) { 
    out.say("progress", "skipping already uploaded file"); 
    context.skip = true; 
            
} 

    //var splitted = source.split("/"); 
    //var filename = splitted[splitted.length -1]; 
    //var s = filename.split(".");  
    //var ext = s[s.length - 1]; 
    //out.say("progress", "Starting to upload file <b>" + title + "</b>"); 
            
    //if(title[title.length - 1] != ".") 
        //out.title = title + "." + ext; 
    //else
        //out.title = title + ext; 
        
    // remove extension because upload adds it
    var title = context.doc[context.node.params.title];
    if(title) {
    title = title.replace(".jpg","");
    title = title.replace(".tif","");
}
    
    if(Array.isArray(context.doc[context.node.params.location]))        
		out.filename = context.doc[context.node.params.location][0]
	else
		out.filename = context.doc[context.node.params.location]
    out.title = title;
    out.wikitext = context.doc[context.node.params.wikitext]; 

