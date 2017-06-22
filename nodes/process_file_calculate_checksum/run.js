
// handle error
if (context.error)
	out.value = out.error_marker + context.error;

// output data if not error
else if(context.data && context.data != "") {
	context.vars.success_counter++;
	out.value = context.data;
} 


