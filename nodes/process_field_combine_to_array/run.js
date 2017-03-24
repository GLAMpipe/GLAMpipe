var in_field = context.node.settings.in_field;
var output = [];

function combine (value) { 
   if(Array.isArray(value)) {
	   value.forEach(function(row) {
		   row = preprocess(row);
		   if(row)
				output.push(row);
	   })
   } else {
	   value = preprocess(value);
	   if(value)
			output.push(value);
   } 
  
}

// lowercase and trim if wanted
function preprocess (value) {
	// lowercase
	if(context.node.settings.lowercase && typeof value === "string")
		value = value.toLowerCase();
	// trim
	if(context.node.settings.trim && typeof value === "string")
		value = value.trim();
	// remove empty
	if(context.node.settings.remove_empty && value == "")
		value = null;
	// only one value 
	if(context.node.settings.onlyone && output.length == 1)
		value = null;
	// remove duplicates
	if(context.node.settings.remove_duplicate && output.includes(value))
		value = null;
	
	return value;
}


if(Array.isArray(in_field)) {
	in_field.forEach(function(field) {
		combine(context.doc[field]);
	})
} else {
	var val = context.doc[context.node.settings.in_field]; 	
}


out.value = output;
