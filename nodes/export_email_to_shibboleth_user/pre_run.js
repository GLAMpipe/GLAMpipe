
// send email only if this node has not been executed before for this document
if(!context.doc[context.node.params.out_field]) {

	// "to" field comes from shibboleth header
	if(context.config.shibbolethHeaderId && context.node.req.headers[context.config.shibbolethHeaderId]) {
		var to = context.node.req.headers[context.config.shibbolethHeaderId];

		var data_fields = context.node.params.data_fields.split(",");
		var data_str = dataVariables(data_fields); 
		
		var subject = matchVariables(context.node.params.subject);
		subject = subject.slice(0,80);
		var text = matchVariables(context.node.params.text); 
		text = addVariables(text, "data_fields", data_str);
		
		var data = {
			from: context.node.params.from,
			to: to,
			subject: subject,
			text: text
		}

		out.pre_value = data;
	}
}

// find all [[]] variables from text and replace with document values
function matchVariables(str) {

	var result = str.match(/\[\[(.*?)\]\]/g);
	if(result) {
		for(var i=0; i < result.length; i++) {
			var field = result[i].replace(/[\[\]]/g, "");
			var value = context.doc[field];
			if(typeof  value !== "undefined" || value != null && field != "data_fields")
				str = addVariables(str, field, value);
			
		}
	}
	return str;
}

function addVariables(str, variable, value) {
	var regexp = new RegExp("\\[\\["+variable+"\\]\\]", "g");
	return str.replace(regexp, value);
}

function dataVariables(fields) {
	var data = "";
	if(fields && fields[0] != "*") {
		for(var i=0; i < fields.length; i++) {
			var value = context.doc[fields[i].trim()];
			if(typeof  value !== "undefined" || value != null ) {
				data += fields[i].trim() + ":\n";
				data += value + "\n\n";
			}
		}
	} else {
		for(var key in context.doc) {
			data += key + ":\n"
			data += context.doc[key] + "\n\n";
		}
	}
	return data;
}
