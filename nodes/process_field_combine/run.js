
var get = context.get; 
var doc = context.doc; 
var settings = context.node.settings; 

var field1_value = doc[settings.field1];
var field2_value = doc[settings.field2];

var arr = []; 

// if both are arrays
if(Array.isArray(field1_value) && Array.isArray(field2_value)) {
	var max = Math.max(field1_value.length, field2_value.length);
	for(var i = 0; i < max; i++) {
		if(field1_value[i]) {
			if(field2_value[i]) 
				arr.push(join(field1_value[i], field2_value[i]));
			else
				arr.push(join(field1_value[i], ""));
				
		} else {
			arr.push(join("", field2_value[i]));
		}
				
	}
// if one is array
} else if (Array.isArray(field1_value)) {
	field1_value.forEach(function(element) {
		arr.push(join(element, field2_value));
	})
} else if (Array.isArray(field2_value)) {
	field2_value.forEach(function(element) {
		arr.push(join(field1_value, element));
	})
// else both are strings
} else {
	arr = join(field1_value, field2_value);
}





function join (val1, val2) {
	var str = [];
	str.push(settings.prefix);
	str.push(val1);
	str.push(settings.after_field1);
	str.push(val2);
	//str.push(settings.after_field2);
	str.push(settings.suffix);
	return str.join("");
}


if(parseInt(context.count) % 1000 == 0) 
    out.say('progress', context.node.type.toUpperCase() + ': processed ' + context.count + '/' + context.doc_count);

out.setter = {};
out.setter[context.node.params.out_field] = arr;
//out.value = arr.join(""); 
