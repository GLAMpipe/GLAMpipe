
var base = context.node.settings.base_url;

// we must output array of URLs
if(Array.isArray(context.doc[context.node.params.in_field])) {
	out.pre_value = [];
	var urls = context.doc[context.node.params.in_field];
	urls.forEach(function(url) {
		var options = {
			url:base + url,
			method: 'HEAD'
		}
		out.pre_value.push(options);
	})
} else {
	var options = {
		url:base + context.doc[context.node.params.in_field],
		method: 'HEAD'
	}
	out.pre_value = [options];
}

