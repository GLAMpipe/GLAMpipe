
// pdfx output as json
var data = context.data;

out.setter = {};

if(context.data.error) {
	out.value.push(context.data.error);
	
} else if (context.data.response.statusCode == 200) {
	out.value.push("200");
	context.vars.success_counter++;
} else {
	out.value.push(context.data.response.statusCode + "");
}




