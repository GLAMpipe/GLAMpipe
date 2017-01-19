

// options:
// - trim
// - lowercase
// - remove all whitespaces
// - numeric comparasion (<>)

var params = context.node.params;
var settings = context.node.settings;

var input_field = params.in_field;
var input_value = context.doc[input_field];
var select_value = settings.select;


out.value = null;

if(Array.isArray(input_value)) {
	
} else {
	
	out.value = compare(input_value, select_value);
}

if(out.value)
	context.vars.success_counter++;

function compare (input, select) {
	// numeric greater or smaller
	if(settings.numeric) {
		input = parseFloat(input);
		select = parseFloat(select);
		if(settings.comparision === ">")
			return (input > select ? context.doc : null)
		else if(settings.comparision === "<")
			return (input < select ? context.doc : null)
		
	}
	
	if(input == select) // == is intentional (user can only insert strings)
		return context.doc;
	else 
		return null;
}
