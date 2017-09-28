
// send email only if this node has not been executed before for this document
if(!context.doc[context.node.params.out_field]) {
	var data = {
		to: context.node.params.to,
		subject: context.node.settings.subject,
		text: context.node.settings.text
	}

	out.pre_value = data;

}




