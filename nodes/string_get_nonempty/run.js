
var result = [];

// 3 modes
// - output all non-empty values
// - output all values
// - output first non-empty
var mode = context.node.settings.mode;

var input_1 = context.doc[context.node.settings.in_field_1];
var input_2 = context.doc[context.node.settings.in_field_2];
var input_3 = context.doc[context.node.settings.in_field_3];
var input_4 = context.doc[context.node.settings.in_field_4];

join(input_1);  
join(input_2);  
join(input_3);  
join(input_4);  


// pick first non-empty if mode is "first non-empty"
if(mode === "first-non-empty" && result.length >= 1)
	result = [result[0]];

// check if default value is needed && defined
if(!result.some(non_empty))
	result = [context.node.settings.default]

// output can be string or array
if(context.node.settings.as_string === "true") {
	out.value = result.join(context.node.settings.separator);
} else {
	out.value = result;
}

if(parseInt(context.count) % 100 == 0) 
	out.say('progress', context.node.type.toUpperCase() + ': processed ' + context.count + '/' + context.doc_count);





function join (input) { 
	
	if(Array.isArray(input)) {
		for(var i=0; i < input.length; i++) {
			if (mode === "non-empty" || mode === "first-non-empty") {
				if(non_empty(input[i]))
					result.push(input[i]);
			} else {
				result.push(input[i]);
			}
		}
		
	} else if ((mode === "non-empty" || mode === "first-non-empty") && non_empty(input)) 
		result.push(input);
	else
		result.push(input);

}

function non_empty(input) {
	if(input && typeof input === "string" || typeof input === "number")
		return true;
	else
		return false;
}

function empty_array(arr) {
	
}

