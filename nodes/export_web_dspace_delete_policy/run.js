


if(context.error) {
	out.value = out.error_marker + context.error;
} else if(!context.skip && context.data && context.response) {
	out.value = context.data;
}


