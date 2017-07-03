if(context.error) {
	out.setter[context.node.params.out_link] = out.error_marker + context.error;
} else if(!context.skip && context.response) {
	context.success_count++;
	out.setter = {};
	out.setter[context.node.params.out_field] = context.response.statusCode;
}
