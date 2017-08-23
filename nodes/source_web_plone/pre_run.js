



var options = {
	url: context.search_url, // set by init.js 
	method: "GET",
	headers: {
		"accept": "application/json",
		"authorization": "Bearer " + context.login.token
	}
};

out.options = options;
out.say('progress', 'Starting to import from plone ' + out.options.url); 

// variables for node
context.vars = {};
context.vars.record_counter = 0;
context.vars.round_counter = 0;
context.vars.offset = 0;
context.vars.limit = 100
