

out.value = [];

function process (element, index) {
	
	if(element.error) {
		out.value.push(element.error.message);
	} else {
		out.value.push(element.response.statusCode.toString());
		context.vars.success_counter++;
	}
}

// process array
context.data.forEach(process);


