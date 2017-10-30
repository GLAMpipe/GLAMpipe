

out.value = "";

function process (element, index) {
	out.console.log(element);
	if(element.error) {
		out.value = out.error_marker + ":" + element.error.message;
	} else if (element.response && element.response.statusCode) {
		out.value = element.response.statusCode.toString();
		context.vars.success_counter++;		
	} else {
		out.value = out.error_marker;

	}
}


//process(context.data);
if(context.error) {
	out.value = out.error_marker + context.error;
}else if(context.data && context.response.statusCode === 200) {
	out.value = context.data;
} else if(context.response) {
	out.value = out.error_marker + context.response.statusCode.toString();
} else {
	out.value = out.error_marker;
}


