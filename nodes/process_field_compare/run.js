

var static_yes = null;
var static_no = null;
var dynamic_yes = null;
var dynamic_no = null;

// check if user wants to override values

// static overrides
if(context.node.settings.static_yes)
	static_yes = context.node.settings.static_yes;
if(context.node.settings.static_no)
	static_no = context.node.settings.static_no
// dynamic overrides
if(context.node.settings.dynamic_yes)
	dynamic_yes = context.doc[context.node.settings.dynamic_yes];
if(context.node.settings.dynamic_no)
	dynamic_no = context.doc[context.node.settings.dynamic_no]

var value_1 = context.doc[context.node.params.in_field]; 
var value_2 = context.doc[context.node.params.in_field2]; 
out.value = compare(value_1, value_2);  

if(parseInt(context.count) % 1000 == 0) 
	out.say('progress', context.node.type.toUpperCase() + ': processed ' + context.count + '/' + context.doc_count);



function compare (value_1, value_2) { 
	
	var result = []; 

	// both are arrays
	if(Array.isArray(value_1) && Array.isArray(value_2)) {
		for (var i = 0; i < value_1.length; i++) { 
			// try to find pair form other value
			if(value_2[i]) {
				result.push(match(value_1[i],value_2[i]))
			}
		}
	   
	// value_1 is array
	} else if(Array.isArray(value_1) && typeof value_2 === "string") {  
		for (var i = 0; i < value_1.length; i++) { 
			result.push(match(value_1[i], value_2))
		}
		
	// both are strings
	} else  if(typeof value_1 && typeof value_2 === "string") {
		result = match(value_1, value_2);
	}
	
	return result;
}

function match(val1, val2) {
	if(val1 == val2) {
		if(static_yes)
			return static_yes;
		if(dynamic_yes)
			return dynamic_yes;

	} else {
		if(static_no)
			return static_no;
		if(dynamic_no)
			return dynamic_no;
	}	
	return "";
}



