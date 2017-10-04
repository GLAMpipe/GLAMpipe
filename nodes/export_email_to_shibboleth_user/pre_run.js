
// send email only if this node has not been executed before for this document
if(!context.doc[context.node.params.out_field]) {
	
	// "to" field comes from shibboleth header
	if(context.config.shibbolethHeaderId && context.node.req.headers[context.config.shibbolethHeaderId]) {
		var to = context.node.req.headers[context.config.shibbolethHeaderId];

		// replace variables with document values
		var subject = addVariables(context.node.settings.subject);
		var text = addVariables(context.node.settings.text);
		
		var data = {
			from: context.node.params.from,
			to: to,
			subject: subject,
			text: text
		}

		out.pre_value = data;

	}
}


function addVariables(str) {
	var var1 = context.node.settings.field1_varname;
	var value1 = context.doc[context.node.settings.field1];
	var regexp = new RegExp("\\[\\["+var1+"\\]\\]", "g");
	return str.replace(regexp, value1);
}

