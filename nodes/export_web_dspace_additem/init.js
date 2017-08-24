
        
out.say('progress', 'Starting to upload..'); 
context.counter = 0;
var title_mapped = false;

var rest_url = context.node.params.required_url;
var collection = context.node.settings.collection;


// ERROR CHECKS
// is collection set
if(collection == "") {
	//out.say("error", "You must choose a collection");
	out.init_error = "You must choose a collection";
}


// upload url
out.url = rest_url + "/collections/" +collection+ "/items/";
