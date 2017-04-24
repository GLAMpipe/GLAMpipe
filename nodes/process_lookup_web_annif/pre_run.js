
// we generate POST request options

out.method = "post";

var in_field_value = context.doc[context.node.params.in_field];
if(Array.isArray(in_field_value)) {
	out.pre_value = [];
	in_field_value.forEach(function(value) {
		 var options = {
			url:  "http://api.annif.org/v0/autoindex",
			headers: {
				"accept": "application/json"
			},
			formData: {text:value, 
				project:context.node.settings.lang,
				maxhits:context.node.settings.maxhits,
				threshold:context.node.settings.threshold
				}
		};
		out.pre_value.push(options);
	})

} else {
	out.pre_value = {
		url:  "http://api.annif.org/v0/autoindex",
		headers: {
			"accept": "application/json"
		},
		formData: {text:in_field_value, 
			project:context.node.settings.lang,
			maxhits:context.node.settings.maxhits,
			threshold:context.node.settings.threshold
			}
	};	
}





