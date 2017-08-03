
// recursive split
function doit(val) { 
	
	var result = []; 

	if (Array.isArray(val)) {
		for (var i = 0; i < val.length; i++) { 
			result.push(convert(val[i]))
		}
	   
	} else {  
		return [convert(val)];
	}
	return result;
}

function convert(value) {
	if(typeof value === "string") {
		
		// trim
		if(context.node.settings.trim)
			value = value.trim();
		
		// mode
		if(context.node.settings.mode === "lower")
			return value.toLowerCase();
		else
			return value.toUpperCase();
	} else {
		return "";
	}
}

if(parseInt(context.count) % 1000 == 0) 
	out.say('progress', context.node.type.toUpperCase() + ': processed ' + context.count + '/' + context.doc_count);

			
var val = context.doc[context.node.params.in_field]; 
out.value = doit(val);  
