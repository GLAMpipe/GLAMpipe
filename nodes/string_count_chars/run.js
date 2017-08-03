
// count characters
// NOTE: we return strings, not integers!
function split (val) { 
	
	if (Array.isArray(val)) {
		var result = [];
		var result_strings = [];
		for (var i = 0; i < val.length; i++) { 
			var l = getLength(val[i])
			result.push(l); 
			result_strings.push(l.toString()); 
		}
		
		if(context.node.settings.combine) {
			return result.reduce(add, 0).toString();
		} else {
			return result_strings;
		}
	   
	} else if(val) {
		return getLength(val).toString();
	} else {
		return "0";
	}

}

function getLength(val) {
	if(typeof val === "string") {  
		return val.trim().length;
	} else if(typeof val === "number") {  
		return val.toString().trim().length;
	}
	return "0";
}

function add(a, b) {
	return a + b;
}

if(parseInt(context.count) % 1000 == 0) 
	out.say('progress', context.node.type.toUpperCase() + ': processed ' + context.count + '/' + context.doc_count);

			
var val = context.doc[context.node.params.in_field]; 
out.value = split(val);  
