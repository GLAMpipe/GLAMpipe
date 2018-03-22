var title = context.doc[context.node.params.in_field]; 
var source = context.doc[context.node.params.in_location]; 

var ext = "";
if(context.node.params.location_ext)
	ext = context.doc[context.node.params.location_ext];

var upload = {};

// checksum test
if(Array.isArray(context.doc[context.node.params.in_checksum_result]))
	var file_check = context.doc[context.node.params.in_checksum_result][0];
else
	var file_check = context.doc[context.node.params.in_checksum_result];

/* if checksum test found a link, then skip that record */
if(file_check.match(/^https:\/\//)) { 
    out.say("progress", "skipping already uploaded file"); 
    context.skip = true;          
}            

//there can be only one title per doc!
var title = context.doc[context.node.params.in_title];
if(Array.isArray(title))
	title = title[0];

// there can be only one file per doc!
if(Array.isArray(context.doc[context.node.params.in_location]))        
	upload.filename = context.doc[context.node.params.in_location][0]
else
	upload.filename = context.doc[context.node.params.in_location]


// add file extension
if(ext) {
	title = title + "." + ext;
	title = title.replace(/\.+/g, "."); // remove possible double dots (like "name..jpg")
  //  title = title.replace(".tif","");
}

upload.title = title;
upload.wikitext = context.doc[context.node.params.in_wikitext]; 

/* if commons url is set, then skip that record */
var url_val = context.get(context.doc, context.node.params.out_field);
if(url_val.match(/^https:\/\//)) { 
    out.say("progress", "skipping already uploaded file"); 
    context.skip = true;          
} 

// we skip upload if information is missing
if(!upload.filename || !upload.title || !upload.wikitext)
	context.skip = true;

// OUTPUT
out.pre_value = upload; 

