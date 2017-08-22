

if(context.node.settings.collection)
	out.url = context.urljoin(context.node.params.url, context.node.settings.collection, "@search");
else
	out.url = context.urljoin(context.node.params.url, "@search");
	
out.url = "https://kirjasto.jyu.fi/kauppa/@search";

var options = {
	url: out.url,  
	headers: {
		"accecpt": "application/json",
		"authorization": "Bearer " + context.login.token
	}
};

out.options = options;
out.say('progress', 'Starting to import from plone ' + out.url); 

// variables for node
context.vars = {};
context.vars.record_counter = 0;
context.vars.round_counter = 0;
context.vars.offset = 0;
context.vars.limit = 100
