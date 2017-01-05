
out.value = null;
var outputs = [];

if(!context.error) {
	var data = context.data;
	var json = context.parser.toJson(data);
	var refs = JSON.parse(json);
	
	context.vars.success_counter++;

	if(refs.TEI.text.back.div.listBibl.biblStruct) {
		refs.TEI.text.back.div.listBibl.biblStruct.forEach(function(ref) {
			var output = createRef(context.doc);	
			if(ref.analytic) {
				output.gr_title = ref.analytic.title.$t;
				if(ref.monogr)
					output.gr_teoksessa = ref.monogr.title.$t;
			} else if(ref.monogr) {
				output.gr_monogr = ref.monogr.title.$t;
			}
			outputs.push(output);
		})
	} else {
		var output = createRef(context.doc);
		output.status = "extraction error";
		outputs.push(output);	
	}
	
	out.value = outputs;
		
} else {
	out.console.log(context.error.message);
	var output = createRef(context.doc);
	output.status = "file error";
	out.value = [output];
}

//out.console.log("processed");

function createRef (source) {
	var ref = JSON.parse(JSON.stringify(source));
	delete ref._id;

	return ref;
}

