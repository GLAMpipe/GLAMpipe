
var upload = {}
		
upload.filepath = context.doc[context.node.params.in_field][0];
upload.url = "http://localhost:8081/processReferences";

if(context.vars.counter < 20)
	out.value = upload;
