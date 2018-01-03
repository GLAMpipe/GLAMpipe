
var response = context.response;
out.setter = {}

if(response.statusCode == 200) {
	context.success_counter++;
	
}

if(response)
	out.setter[context.node.params.out_field] = response.statusCode;


