
var get = context.get; 
var doc = context.doc; 
var settings = context.node.settings; 
var input = doc[context.node.params.in_field];


function join(input) {
	// check if there is a nested array
	if(Array.isArray(input) && Array.isArray(input[0])) {
		var result = [];
		input.forEach(function(row) {
			out.console.log(row)
			result.push(row.join(settings.join));
		})
		return result;
		
	} else if(Array.isArray(input)) {
		return input.join(settings.join);
	} else
		return "";
}


out.value = join(input);

if(parseInt(context.count) % 100 == 0) 
    out.say('progress', context.node.type.toUpperCase() + ': processed ' + context.count + '/' + context.doc_count);

