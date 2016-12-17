
// recursive split
function split (val) { 
	
	var result = []; 

	if (Array.isArray(val)) {
		for (var i = 0; i < val.length; i++) { 
			var splitted2 = split(val[i]); 
			/* push result  */
			for (var j = 0; j < splitted2.length; j++) {
				result.push(splitted2[j]); 
			}
		}
	   
	} else {  

		// split by linebreaks or by character(s)
		if(context.node.settings.linebreaks)
			var result = val.split(/\r?\n/);
		else
			var result = val.split(context.node.settings.separator);

		// remove empty lines if "skip empty" is set
		if(context.node.settings.skip_empty) 
			result = result.filter(Boolean)

	}
	return result;
}



if(parseInt(context.count) % 1000 == 0) 
	out.say('progress', context.node.type.toUpperCase() + ': processed ' + context.count + '/' + context.doc_count);

			
var val = context.doc[context.node.params.in_field]; 
out.value = split(val);  
