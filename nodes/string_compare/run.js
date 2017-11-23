
// original value
var value_1 = context.doc[context.node.params.in_field]; 

var trim = false;
if(context.node.settings.trim === "true")
	trim = true;

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

// check if users wants to compare to dynamic or string
if(context.node.settings.comp_dynamic)
	var value_2 = context.doc[context.node.settings.comp_dynamic];
else
	var value_2 = context.node.settings.comp_static;
 
out.value = compare(value_1, value_2);  

if(parseInt(context.count) % 1000 == 0) 
	out.say('progress', context.node.type.toUpperCase() + ': processed ' + context.count + '/' + context.doc_count);



function compare (value_1, value_2) { 
	
	var result = []; 
	// both are arrays
	if(Array.isArray(value_1) && Array.isArray(value_2)) {
		for (var i = 0; i < value_1.length; i++) { 
			// try to find pair for other value
			if(typeof value_2[i] !== "undefined") {
				result.push(match(value_1[i],value_2[i], i))
			}
		}
	   
	// value_1 is array
	} else if(Array.isArray(value_1) && typeof value_2 === "string") {  
		for (var i = 0; i < value_1.length; i++) { 
			result.push(match(value_1[i], value_2, i))
		}
		
	// both are strings
	} else  if(typeof value_1 && typeof value_2 === "string") {
		result = match(value_1, value_2);
	}
	return result;
}

function match(val1, val2, index) {
	
	
	if(trim) {
		if(typeof val1 === "string")
			val1 = val1.trim();
		if(typeof val2 === "string")
			val2 = val2.trim();
	}
	
	// if other field is empty(i.e. no match), and user has set reverse match for empties, then we copy other value to it
	if(context.node.settings.mode === "empty-match") {
		if(!val1)
			return val2;
		if(!val2)
			return val1;
	}
		
	if(val1 == val2) {
		if(static_yes)
			return static_yes;
			
		// try to find matching index from match value
		if(dynamic_yes && Array.isArray(dynamic_yes)) {
			if(typeof index !== "undefined" && dynamic_yes[index])
				return dynamic_yes[index];
		} else {
			return dynamic_yes;
		}

	} else {
		if(static_no)
			return static_no;
			
		// try to find matching index from match value
		if(dynamic_no && Array.isArray(dynamic_no)) {
			if(typeof index !== "undefined" && dynamic_no[index])
				return dynamic_no[index];
		} else {
			return dynamic_no;
		}
	}	
	return "";
}



