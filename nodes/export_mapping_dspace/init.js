
        
out.say('progress', 'Starting to map...'); 
context.counter = 0;
var title_mapped = false;

var rest_url = context.node.params.required_url;
var collection = context.node.settings.collection;

// check that at least dc.title is set
if(!context.node.settings["_dynamic_dc_title"] && !context.node.settings["_static_dc_title"])
	out.init_error = "You must map at least dc_title";


