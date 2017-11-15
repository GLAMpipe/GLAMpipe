
// recursive split
function split (val) { 

		
	var result = []; 

	if(Array.isArray(val)) {
		for (var i = 0; i < val.length; i++) { 
			if(context.node.settings.one_array === "true") {
				var splitted2 = split(val[i]);
				for (var j = 0; j < splitted2.length; j++) {
					result.push(splitted2[j]); 
				}
			} else {
				result.push(split(val[i])); 
			}

		}
	   
	} else if(typeof val === "string") {  
		// split by linebreaks or by character(s)
		if(context.node.settings.linebreaks === "true")
			var result = val.split(/\r?\n/);
		else
			var result = val.split(context.node.settings.separator);
			
		if(context.node.settings.trim === "true")
			result = result.map(function(e){return e.trim();});

		// remove empty lines if "skip empty" is set
		if(context.node.settings.skip_empty === "true") 
			result = result.filter(Boolean)

	}
	return result;
}



if(parseInt(context.count) % 1000 == 0) 
	out.say('progress', context.node.type.toUpperCase() + ': processed ' + context.count + '/' + context.doc_count);

			
var val = context.doc[context.node.params.in_field]; 
out.value = split(val);  
