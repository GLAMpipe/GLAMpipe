
// increase success counter
if(context.response && context.response.statusCode == 200) {
	context.success_counter++;
} else {
	
}

// set output
if(context.response) {
	out.value = context.response.statusCode;
} else if (context.error) {
	out.value = context.error;
} else {
	out.value = "ERROR";
}


