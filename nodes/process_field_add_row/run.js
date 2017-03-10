

out.value = []; // we output array
var match = false;

if(context.doc[context.node.params.in_field]) {
	
	// node input
    var value = context.doc[context.node.params.in_field]; 
    
	var reg = new RegExp(context.node.settings.search); 
	
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

