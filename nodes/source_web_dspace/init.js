

	var base_url = context.node.params.dspace_url;
	var details = [];

	// variables for node
	context.vars = {};
	context.vars.initial_round_counter = 0;
	context.vars.round_counter = 0;
	context.vars.record_counter = 0;
	context.vars.offset = 100;
	if(context.node.settings.metadata)
		details.push("metadata");
	if(context.node.settings.bitstreams)
		details.push("bitstreams");

	context.vars.query_path = "/items?expand=" + details.join(",");

	// init record limiter
	context.vars.limit = parseInt(context.node.settings.dspace_limit); 
	if (context.vars.limit <= 0 || isNaN(context.vars.limit)) 
		context.vars.limit = 999999999; 

	// initial rounds
	if(context.node.settings && context.node.settings.dspace_handle) {
		context.vars.collections = context.node.settings.dspace_handle.split(",");
		context.vars.collection_count = context.vars.collections.length;
	} else {
		out.say("error", "node settings missing");
	}

	// if limit is less than default offset, then fetch only to limit
	if(context.vars.limit < context.vars.offset)
		context.vars.offset = context.vars.limit;



