
out.setter = {};
out.setter[context.node.params.out_field] = "";
out.setter[context.node.params.out_link] = "";

// create DSpace UI address 
var splitted = context.node.params.url.split("/");
var link_root = splitted.slice(0, splitted.length-1).join("/");

// increase success counter
if(context.response && context.response.statusCode == 200) {
	context.success_counter++;
	
	out.setter[context.node.params.out_field] = context.response.statusCode;
	if(context.data && context.data.retrieveLink)
		out.setter[context.node.params.out_link] = link_root + context.data.retrieveLink;
		
} else if (context.error) {
	out.setter[context.node.params.out_field] = out.error_marker + context.error;
} else {
	out.setter[context.node.params.out_field] = out.error_marker;
}


