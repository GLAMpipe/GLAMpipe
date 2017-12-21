var c = context;
var template = c.node.settings.template;
var docid = c.doc._id.toString();

// fill placeholders
c.vars.keys.forEach(function(key) {
	if(c.doc[key]) {
		if(Array.isArray(c.doc[key]))
			template = template.replace(new RegExp("\\[\\["+key+"\\]\\]", 'g'), c.doc[key].join(c.node.settings.sep));
		else
			template = template.replace(new RegExp("\\[\\["+key+"\\]\\]", 'g'), c.doc[key]);
	}
})

// date
template = template.replace(new RegExp("{{date}}", 'g'), c.vars.date);

if(parseInt(context.count) % 100 == 0) 
    out.say('progress', context.node.type.toUpperCase() + ': processed ' + context.count + '/' + context.doc_count);


// OUTPUT
out.file = docid + c.node.settings.extension;
out.value = c.config.url + "/api/v1/nodes/" + c.node._id + "/files/" + out.file;
out.text = template;

