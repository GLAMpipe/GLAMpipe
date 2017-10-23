
var response = context.data;
var url = context.node.params.required_url.replace(/\/api$/, ""); // this assumes that rest is in "api" endpoint

if(response) {
	// if site is given, then we create a link to the item in the site
	if(context.node.params.site_slug)
		out.value = url + "/s/" + context.node.params.site_slug + "/item/" + response["o:id"];
	// otherwise we create link to admin site 
	else
		out.value = url + "/admin/item/" + response["o:id"];
}

if(response.errors) {
	if(response.errors.error)
		out.value = out.error_marker + response.errors.error;
	else
		out.value = out.error_marker + response.errors;
}

