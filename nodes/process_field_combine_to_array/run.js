var in_field = context.node.params.in_field;
var output = [];

function combine (value) { 
   if(Array.isArray(value)) {
	   value.forEach(function(row) {
		   row = preprocess(row);
		   if(!output.includes(row))
				output.push(row);
	   })
   } else {
	   value = preprocess(value);
	   if(!output.includes(value))
			output.push(value);
   } 
  
}

// lowercase and trim if wanted
function preprocess (value) {
	if(context.node.settings.lowercase && typeof value === "string")
		value = value.toLowerCase();
	if(context.node.settings.trim && typeof value === "string")
		value = value.trim();
	
	return value;
}


if(Array.isArray(in_field)) {
	in_field.forEach(function(field) {
		combine(context.doc[field]);
	})
} else {
	var val = context.doc[context.node.params.in_field]; 	
}


out.value = output;
