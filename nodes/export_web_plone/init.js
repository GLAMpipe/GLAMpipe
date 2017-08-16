
        
out.say('progress', 'Starting to upload..'); 
context.counter = 0;
var title_mapped = false;

// remove last / from url
if(context.node.params.url.trim().slice(-1) === "/")
	var rest_url = context.node.params.url.trim() + context.node.settings.collection;
else
	var rest_url = context.node.params.url.trim() + "/" + context.node.settings.collection;


/*
// check that there is at least title
for (mapkey in context.node.settings) {
	// loop over keys that are mapped
	if(mapkey.indexOf("_mapkey_") != -1) {
		if(context.node.settings[mapkey] == "dc.title")
			title_mapped = true;
	}
}

// ERROR CHECKS
// is collection set
if(collection == "") {
	//out.say("error", "You must choose a collection");
	out.init_error = "You must choose a collection";
}

// is "dc.title" mapped (and data is not allready in rest api format) 
if(!title_mapped && !context.node.settings.rest_data) {
	//out.say("error", "You must map at least dc.title");
	out.init_error = "You must map at least dc.title";
}
*/
// upload url
out.url = rest_url;
