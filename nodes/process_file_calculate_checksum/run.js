
// output as json
var data = context.data;

if (data.error)
	out.value = out.error_marker;
else if(data && data != "") {
	context.vars.success_counter++;
	out.value = context.data;
} 


