

// options:
// - trim
// - lowercase
// - remove all whitespaces
// - numeric comparasion (<>)

// currently only one match is needed

var params = context.node.params;
var settings = context.node.settings;

var input_field = params.in_field;
var input_value = context.doc[input_field];
var select_value = settings.select.split(";");

out.value = null;


if(Array.isArray(input_value)) {
	input_value.forEach(function(value) {
		if(compare(value, select_value)) {
			out.value = context.doc._id;
		}
	})
	
} else {
	if(compare(input_value, select_value))
		out.value = context.doc._id;
}

if(out.value)
	context.vars.success_counter++;

// returns on first match
function compare (input, select) {
	
	for(var i = 0; i < select.length; i++) {
		// numeric greater or smaller
		if(settings.numeric) {
			input = parseFloat(input);
			var value = parseFloat(select[i]);
			if(settings.comparision === ">")
				return (input > value ? context.doc._id : null)
			else if(settings.comparision === "<")
				return (input < value ? context.doc._id : null)
			
		}
		
		if(input == select[i]) // == is intentional (user can only insert strings)
			return context.doc._id;
		
	}
	return false;
	

}
