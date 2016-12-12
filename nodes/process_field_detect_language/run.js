
// context.data holds language detection result
// context.doc holds current document

if(context.data != null && Array.isArray(context.data)) {
	
	var detects = [];
	for (var i = 0; i < context.data.length; i++) {
		
		// count only non-empty values
		if(context.doc[context.node.params.in_field][i] != "")
			context.node.value_counter++;
		
		// count succesfull detects
		if(context.data[i] != null && context.data[i].reliable) {
			context.node.success_counter++;
			detects.push(context.data[i].languages[0].code);
			
		} else {
			//out.say('progress', "LANGUAGE NOT DETECTED!");
			if(i == 0)
				detects.push(undefined);
			else
				break;
		}
		
		
	}
	out.value = detects;
} else 
    out.say('error', "language detection failed completely"); 


