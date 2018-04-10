
var base = context.node.settings.base_url;
if(!base) {
	base = "";
}

// check if we have a static url (eg. backend call from external app)
if(context.node.settings.url_static) {
	var options = {
		url: context.node.settings.url_static,
		method: 'GET'
	}
	setAccept(options);
	out.pre_value = [options];

// we must output array of URLs
} else if(Array.isArray(context.doc[context.node.params.in_field])) {
	out.pre_value = [];
	var urls = context.doc[context.node.params.in_field];
	urls.forEach(function(url) {
		var options = {
			url:base + url,
			method: 'GET'
		}
		setAccept(options);
		out.pre_value.push(options);
	})
} else {
	var options = {
		url:base + context.doc[context.node.params.in_field],
		method: 'GET'
	}
	setAccept(options);
	out.pre_value = [options];
}

function setAccept(options) {
	if(context.node.settings.accept) {
		options.headers = {
			"Accept":  "application/" + context.node.settings.accept,
		}
	}
}
