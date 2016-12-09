
var base = context.node.params.base_url;

// we must output array of URLs
if(Array.isArray(context.doc[context.node.params.in_field])) {
	out.urls = [];
	var urls = context.doc[context.node.params.in_field];
	urls.forEach(function(url) {
		out.urls.push(base + url);
	})
} else {
	out.urls = [base + context.doc[context.node.params.in_field]];
}

