
var response = context.data;

if(response) {
	
	var splitted = context.node.params.url.split("/");
	var link_root = splitted.slice(0, splitted.length-1).join("/") + context.node.params.dspace_ui;
	out.setter = {};
	out.setter[context.node.params.out_uuid] = response.uuid;
	out.setter[context.node.params.out_handle] = response.handle;
	out.setter[context.node.params.out_link] = link_root + "/handle/" + response.handle;
}


