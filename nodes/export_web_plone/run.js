
out.setter = {};

if(context.error) {
	out.setter[context.node.params.out_link] = out.error_marker + context.error;
} else if(!context.skip && context.data && context.response && context.response.statusCode == 201) {
	context.success_count++;
	out.setter[context.node.params.out_link] = context.urljoin(context.data["@id"], context.data["id"]);
}


