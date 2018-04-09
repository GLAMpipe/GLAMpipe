
out.setter = {};

// if retrieve link exists, then copy that to setter so that the link and UUID remains in document
if(context.data && context.data.existing_link) {
	out.setter[context.node.params.out_link] = context.data.existing_link;
	out.setter[context.node.params.out_field] = "";
	
} else {

	// create DSpace root address from API address
	var splitted = context.node.params.required_url.split("/");
	var link_root = splitted.slice(0, splitted.length-1).join("/");

	// increase success counter
	if(context.response && context.response.statusCode == 200) {
		context.success_counter++;
		
		out.setter[context.node.params.out_field] = context.response.statusCode;
		if(context.data && context.data.retrieveLink)
			out.setter[context.node.params.out_link] = link_root + context.data.retrieveLink;

		if(context.data && context.data.uuid) {
			out.setter[context.node.params.out_uuid] = {"uuid": context.data.uuid}; // this simulates how bitstream data is stored when retrieved by DSpace query
			
			// write also bundlename to output (note: bundlename_static value only)
			if(context.node.settings.bundlename_static) {
				out.setter[context.node.params.out_uuid]["bundleName"] = ontext.node.settings.bundlename_static;
			} else {
				out.setter[context.node.params.out_uuid]["bundleName"] = "ORIGINAL";
			}
		}

			
	} else if (context.error) {
		out.setter[context.node.params.out_field] = out.error_marker + context.error;
	} else {
		out.setter[context.node.params.out_field] = out.error_marker;
	}

}
