

out.value = [];

function process (element, index) {
	
	if(element.error) {
		out.value.push(element.error);
	} else if (element.response.statusCode == 200) {
		out.value.push("200");
		context.vars.success_counter++;
	} else {
		out.value.push(element.response.statusCode + "");
	}
}

// process array
context.data.forEach(process);


