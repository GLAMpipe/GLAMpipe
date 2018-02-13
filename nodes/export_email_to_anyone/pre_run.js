
// send email only if this node has not been executed before for this document
if(!context.doc[context.node.params.out_field]) {

	var data_str = '';
	if(context.node.settings.data_fields) {
		var data_fields = context.node.settings.data_fields.split(",");
		data_str = dataVariables(data_fields); 
	}
	
	var subject = matchVariables(context.node.settings.subject);
	subject = subject.slice(0,80);
	var text = matchVariables(context.node.settings.message); 
	text = addVariables(text, "data_fields", data_str);
	
	var data = {
		from: context.node.params.from,
		to: context.node.settings.to,
		subject: subject,
		text: text
	}

	out.pre_value = data;

	// do not send empty messages
	if(text == "" || subject == "")
		out.pre_value = null;

}

// find all [[]] variables from text and replace with document values
function matchVariables(str) {

	if(typeof str !== "string") 
		return "";
		
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
	if(typeof str !== "string") 
		return "";
		
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
