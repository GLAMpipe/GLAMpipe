
        
out.say('progress', 'Starting to upload..'); 
context.counter = 0;
var title_mapped = false;

var rest_url = context.node.params.url;
var collection = context.node.settings.collection;

for (mapkey in context.node.settings) {
	// loop over keys that are mapped
	if(mapkey.indexOf("_mapkey_") != -1) {
		if(context.node.settings[mapkey] == "dc.title")
			title_mapped = true;
	}
}
/*
// ERROR CHECKS
// is collection set
if(collection == "") {
	out.say("error", "You must choose a collection");
	out.init_error = "You must choose a collection";
}

// is "dc.title" mapped
if(!title_mapped) {
	out.say("error", "You must map at least dc.title");
	out.init_error = "You must map at least dc.title";
}
*/
// upload url
out.url = rest_url + "/items?key_identity=" +context.node.settings.key_identity + "&key_credential=" + context.node.settings.key_credential ;


out.url = rest_url + "/items?key_identity=hTHRcFByROlLsO5X2On9orAAwIrKqx6E&key_credential=Zcks0DyoYDGv0ZIyYxscuD5ATYoNZz6L" ;


