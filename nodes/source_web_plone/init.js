

// creates a valid search url

// clean collection name
var collection = context.node.settings.collection.trim().replace("/","")


// remove last / from url
if(context.node.params.url.trim().slice(-1) === "/")
	context.node.params.url = context.node.params.url.trim().slice(0, -1);

// combine collection and search endpoint
if(collection)
	context.search_url = context.node.params.url + "/" + collection + "/@search";
else
	context.search_url = context.node.params.url + "/@search"


// check if user wants index fields or full objects
if(context.node.settings.mode === "all")
	context.search_url = context.search_url + "?fullobjects";
