
var search = context.node.settings.search;
var exact = context.node.settings.exact;
var case_sensitive = context.node.settings.case_sensitive;

var match = false;
out.value = []; // we output array

var options = "";

if(exact === "true")
	search = "^" + search + "$";

if(case_sensitive === "false")
	options = "i";

if(context.doc[context.node.params.in_field]) {
	
	// node input
    var value = context.doc[context.node.params.in_field]; 
    

	var reg = new RegExp(search, options); 
	
	if(value !== null) {
		
		if( typeof value === "string") {
			
			out.value.push(value);
			
			// process string
			if(value.match(reg)) {
				match = true;
			}
			
		} else if (Array.isArray(value)) {
			
			// process array
			for (j = 0; j < value.length; j++) { 
				out.value.push(value[j]);
				if(value[j].match(reg)) {
					match = true;
				}
			}
		}
	}


	// add match
	if(match)
		out.value.push(context.node.settings.content)
   

} 

