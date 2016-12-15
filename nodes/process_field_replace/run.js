

if(context.doc[context.node.params.in_field]) {
	
	// node input
    var value = context.doc[context.node.params.in_field]; 
    

	for (var i=0; i < context.node.settings.search.length; i++) { 
		
		var reg = new RegExp(context.node.settings.search[i], "g"); 
		
		if(value !== null) {
			
			if( typeof value === "string") {
				
				// process string
				value = value.replace(reg, context.node.settings.replace[i]);
				
			} else if (Array.isArray(value)) {
				
				// process array
				for (j = 0; j < value.length; j++) { 
					value[j] = value[j].replace(reg, context.node.settings.replace[i]); 
				}
			}
		}
	}
   
   // add start and end
   if (Array.isArray(value)) {
		for (j = 0; j < value.length; j++) { 
			if(value[j] != "")
				value[j] = context.node.settings.add_start + value[j] + context.node.settings.add_end; 
		}	   
   } else {
	   if(value != "")
			value = context.node.settings.add_start + value + context.node.settings.add_end;
	}
   
   // node output
   out.value = value;

} else { 
   out.say("error", "Field not found"); 
}


