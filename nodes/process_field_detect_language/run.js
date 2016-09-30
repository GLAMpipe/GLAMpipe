
// context.data holds language detection result
// context.doc holds current document

if(context.data != null && context.data.constructor.name == "Array") {
	
	var detects = [];
	for (var i = 0; i < context.data.length; i++) {
		
		// count only non-empty values
		if(context.doc[context.node.params.in_field][i] != "")
			context.node.value_counter++;
		
		// count succesfull detects
		if(context.data[i] != null && context.data[i].reliable) {
			context.node.success_counter++;
			//out.say('progress', "LANGUAGE: " + context.data[i].languages[0].code); 
			detects.push(context.data[i].languages[0].code);
			
		} else {
			//out.say('progress', "LANGUAGE NOT DETECTED!");
			detects.push(undefined);
		}
		
		
	}
	out.value = detects;
} else 
    out.say('error', "language detection failed completely"); 


