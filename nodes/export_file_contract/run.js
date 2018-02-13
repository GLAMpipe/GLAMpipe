var c = context;
var template = c.node.params.template;
var docid = c.doc._id.toString();

function makeHtmlList(arr) {
	if(arr.length == 1 && c.node.settings.single_not_list == "true")
		return arr[0];
		
	html = "<ul>";
	arr.forEach(function(item) {
		html += "<li>" + item + "</li>";
	})
	return html + "</ul>";
}

// fill placeholders
c.vars.keys.forEach(function(key) {
	if(c.doc[key]) {
		if(Array.isArray(c.doc[key])) {
			if(c.node.settings.mode === "join")
				template = template.replace(new RegExp("\\[\\["+key+"\\]\\]", 'g'), c.doc[key].join(c.node.settings.sep));
			else 
				template = template.replace(new RegExp("\\[\\["+key+"\\]\\]", 'g'), makeHtmlList(c.doc[key]));
				
		} else
			template = template.replace(new RegExp("\\[\\["+key+"\\]\\]", 'g'), c.doc[key]);
	}
})

// date
template = template.replace(new RegExp("{{date}}", 'g'), c.vars.date);

if(parseInt(context.count) % 100 == 0) 
    out.say('progress', context.node.type.toUpperCase() + ': processed ' + context.count + '/' + context.doc_count);


// OUTPUT
out.file = docid + c.node.params.extension;
out.value = "/api/v1/nodes/" + c.node._id + "/files/" + out.file;
out.text = template;

