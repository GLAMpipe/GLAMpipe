
// context.data holds language detection result
// context.doc holds current document

if(context.data && Array.isArray(context.data)) {
	
	var detects = [];
	for (var i = 0; i < context.data.length; i++) {
		
		// count detections for only non-empty values
		if(context.doc[context.node.params.in_field][i] != "")
			context.node.value_counter++;

		if(!context.data[i]) {
			detects.push("");
		} else {
			if(!context.node.settings.mode || context.node.settings.mode === "reliable") {
				// count succesfull detects
				if(context.data[i].reliable) {
					context.node.success_counter++;
					// we take the language with highest percentage (first in results)
					detects.push(context.data[i].languages[0].code);
					
				} 	else {
					//out.say('progress', "LANGUAGE NOT DETECTED!");
					if(i == 0)
						detects.push("");
					else
						break;
				}
				
			} else if(context.node.settings.mode === "percentage") {
				var chunks_c = {};
				
				// combine bytes per language
				context.data[i].chunks.forEach(function(c) {
					if(chunks_c[c.code])
						chunks_c[c.code].bytes = chunks_c[c.code].bytes + c.bytes;
					else
						chunks_c[c.code] = {"bytes": c.bytes};
				})
				
				// calculate total bytes
				chunks_c.totalbytes = context.data[i].chunks.reduce(function(sum,value) {
					return sum + value.bytes;
				},0)
				
				// calculate percentage per language
				var highest = 0;
				for(var c in chunks_c) {
					if( chunks_c.hasOwnProperty(c) ) {
						var percent = chunks_c[c].bytes / chunks_c.totalbytes * 100;
						if(percent > highest) {
							chunks_c.highest_percentage = percent;
							chunks_c.highest_code = c;
							highest = percent;
						}
					}
				}
				// if highest percentage is higher that user defined percentage, then output that
				if(chunks_c.highest_percentage > parseInt(context.node.settings.percentage))
					detects.push(chunks_c.highest_code);
				else
					detects.push("");
			}
		}

	}
	
	out.value = detects;
	
} else {
    out.say('error', "language detection failed completely"); 
    out.value = out.error_marker;
}


