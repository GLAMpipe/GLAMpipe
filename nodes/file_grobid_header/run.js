


out.value = null;
var outputs = [];

if(!context.error && context.response.statusCode == 200) {
	var data = context.data;
	try {
		var json = context.parser.toJson(data);
		//console.log(json);
		var refs = JSON.parse(json);
		
		context.vars.success_counter++;

		if(refs.TEI.teiHeader.fileDesc.titleStmt.title) {
			var title = "" 
			if(Array.isArray(refs.TEI.teiHeader.fileDesc.titleStmt.title)) {
				title = refs.TEI.teiHeader.fileDesc.titleStmt.title[0].$t
			} else {
				title = refs.TEI.teiHeader.fileDesc.titleStmt.title.$t;	
				outputs.push(output);				
			}
		} 
	
	} catch (e) {
		var output = createRef(context.doc);
		output.status = "file error";
		output.gr_status = "file error";
		outputs.push(output);
	}	
	
	out.value = title;
		
} else {
	out.console.log(context.error.message);
	var output = createRef();
	output.status = "file error";
	output.gr_status = "file error";
	out.value = "[ERROR]";
}





