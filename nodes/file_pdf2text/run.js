
var out_info_field = context.node.params.out_info;
var out_text_field = context.node.params.out_text;
out.setter = {};

if(out.error) {
	out.setter[out_info_field] = out.error;
	out.setter[out_text_field] = "";
} else {
	if(context.data) {
		if(context.data.info)
			out.setter[out_info_field] = context.data.info;
		if(context.data.text)
			out.setter[out_text_field] = context.data.text;
		context.vars.success_count++;
	}
}
