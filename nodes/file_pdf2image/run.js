
// output as json
var data = context.data;
out.setter = {};

if(context.error)
	out.value = out.error_marker;
	
else if(data && data != "") {
	
	if(typeof context.data === "string") {
		
		var splitted = context.data.split("/");
		var file = splitted[splitted.length - 1];
		
		out.setter[context.node.params.out_link] =  "/api/v1/nodes/" + context.node._id + "/files/" + file;
		out.setter[context.node.params.out_field] = context.data;
		context.vars.success_counter++;
		
	}
} 



