var c = context; 
out.value = [];
if(context.response && context.response.statusCode == 200 && context.data && context.data.results.bindings) {
	var bindings = context.data.results.bindings;
	var numFound = bindings.length;
	out.console.log("FOUND: " + numFound + " wikidata items");
	
	bindings.forEach(function(bind) {
		out.console.log(bind);
		var obj = {};
		context.data.head.vars.forEach(function(field) {
			if(bind[field])
				obj[field] = bind[field].value;
			else
				obj[field] = "";
		})
		
		out.value.push(obj);
	})
	
} else {
	out.value = null;
}

