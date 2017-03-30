
// count characters
// NOTE: we return strings, not integers!
function split (val) { 
	
	if (Array.isArray(val)) {
		var result = [];
		var result_strings = [];
		for (var i = 0; i < val.length; i++) { 
			result.push(val[i].trim().length); 
			result_strings.push(val[i].trim().length.toString()); 
		}
		
		if(context.node.settings.combine) {
			return result.reduce(add, 0).toString();
		} else {
			return result_strings;
		}
	   
	} else {  
		return val.trim().length.toString();
	}
}

function add(a, b) {
	return a + b;
}

if(parseInt(context.count) % 1000 == 0) 
	out.say('progress', context.node.type.toUpperCase() + ': processed ' + context.count + '/' + context.doc_count);

			
var val = context.doc[context.node.params.in_field]; 
out.value = split(val);  
