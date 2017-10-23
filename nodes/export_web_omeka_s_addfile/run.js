

if(context.data && context.data.existing_link) {
	out.value = context.data.existing_link;
} else {


	var response = context.response;
	var data = {};
	try {
		data = JSON.parse(context.data);
	} catch(e) {
		
	}
	var url = context.node.params.required_url.replace(/\/api$/, ""); // this assumes that rest is in "api" endpoint


	// increase success counter
	if(response && response.statusCode == 200) {
		context.success_counter++;
		out.value = url + "/admin/media/" + data["o:id"];
		
	} else if(data && data.errors) {
		if(data.errors.error)
			out.value = out.error_marker + data.errors.error;
		else
			out.value = out.error_marker + data.errors;

	} else if (context.error) {
		out.value = out.error_marker + context.error;
	} else {
		out.value = out.error_marker;
	}

}


