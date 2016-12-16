

var base_url = context.node.params.dspace_url;

// variables for node
context.vars = {};
context.vars.record_counter = 0;
context.vars.round_counter = 0;
context.vars.offset = 100;

// init record limiter
context.vars.limit = parseInt(context.node.settings.dspace_limit); 
if (context.vars.limit <= 0 || isNaN(context.vars.limit)) 
	context.vars.limit = 999999999; 


// if limit is less than default offset, then fetch only to limit
if(context.vars.limit < context.vars.offset)
	context.vars.offset = context.vars.limit;

out.url = base_url + "/filtered-items" + context.node.settings.query;
