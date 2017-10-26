

// options:
// - trim
// - lowercase
// - remove all whitespaces
// - numeric comparasion (<>)

var params = context.node.params;
var settings = context.node.settings;

var input_field = params.source_field;
var input_value = context.doc[input_field];
var select_value = settings.select;


out.value = null;

if(Array.isArray(input_value)) {
	
	input_value.forEach(function(value) {
		if(compare(value, select_value))
			out.value = context.doc;
	})
	
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
	
	var reg = new RegExp(select);
	if(input.match(reg))
		return context.doc;
	else
		return null;
	
	if(input == select) // == is intentional (user can only insert strings)
		return context.doc;
	else 
		return null;
}
