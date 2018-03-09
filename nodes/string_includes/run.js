
// original value
var value_1 = context.doc[context.node.params.in_field]; 
var separator = context.node.settings.comp_separator; 
var comp_arr = context.node.settings.comp.split(separator).map(x => x.trim()); 
var trim = false;
var static_yes = context.node.settings.static_yes;
var static_no = context.node.settings.static_no;

if(context.node.settings.trim === "true")
	trim = true;

out.value = compare(value_1, comp_arr);  

if(parseInt(context.count) % 100 == 0) 
	out.say('progress', context.node.type.toUpperCase() + ': processed ' + context.count + '/' + context.doc_count);



function compare (value_1, value_2) { 
	
	var result; 

	// value_1 is array
	if(Array.isArray(value_1)) {  
		result = value_1.some(match);
	} else {
		result = match(value_1);
	}
	 
	if(result)
		return static_yes;
	else
		return static_no;
		
}

function match(val_1) {

	if(trim) 
		val_1 = val_1.trim();

	return comp_arr.includes(val_1);

}



