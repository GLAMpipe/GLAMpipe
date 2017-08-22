
out.setter = {};

if(!context.skip) {
	if(context.error) {
		out.setter[context.node.params.out_link] = out.error_marker + context.error;
		
		// success
	} else if(context.data && context.response && context.response.statusCode == 201) {
		context.success_count++;
		out.setter[context.node.params.out_link] = context.urljoin(context.data["@id"], context.data["id"]);
		
		// permission error
	} else if(context.response && context.response.statusCode == 401) {
		out.setter[context.node.params.out_link] = out.error_marker + "not authenticated";
		
	} else if(context.response && context.data && context.data.message) {
		out.setter[context.node.params.out_link] = out.error_marker + context.data.message;
		
	} else if(context.data) {
		out.setter[context.node.params.out_link] = out.error_marker + context.data;
	}
}

