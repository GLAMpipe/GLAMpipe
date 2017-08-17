

out.say('progress', 'Starting to upload..'); 
context.counter = 0;
var title_mapped = false;

// remove last / from url
if(context.node.params.url.trim().slice(-1) === "/")
	var rest_url = context.node.params.url.trim() + context.node.settings.collection;
else
	var rest_url = context.node.params.url.trim() + "/" + context.node.settings.collection;

out.url = rest_url + "/@search";


// variables for node
context.vars = {};
context.vars.record_counter = 0;
context.vars.round_counter = 0;
context.vars.offset = 0;
context.vars.limit = 100


