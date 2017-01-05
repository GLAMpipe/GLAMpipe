
if(!context.error) {
	var data = context.data;
	var json = context.parser.toJson(data);

	json.TEI.text.back.div.listBibl.biblStruct.forEach(function(ref) {
		if(ref.analytic) {
			out.console.log("artikkeli: " + ref.analytic.title.$t);
			if(ref.monogr)
				out.console.log("teoksessa: " + ref.monogr.title.$t);
		}
	})
		
} else {
	out.console.log(context.error.message);
}

context.vars.success_counter++;
out.console.log("processed");
