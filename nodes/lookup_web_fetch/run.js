

out.value = "";

function process (element, index) {
	
	if(element.error) {
		out.value = out.error_marker + ":" + element.error.message;
	} else if (element.response && element.response.body) {
		out.value = element.response.body.toString();
		context.vars.success_counter++;		
	} else {
		out.value = out.error_marker;
	}
}


process(context.data);


if(parseInt(context.count) % 10 == 0) 
    out.say("progress", context.node.type.toUpperCase() + ": processed " + context.count + "/" + context.doc_count);
