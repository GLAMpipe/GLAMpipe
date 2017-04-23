var in_field = context.node.settings.in_field;
var output = [];

function combine (field) { 
	var value =	context.doc[field];
    if(Array.isArray(value)) {
	   value.forEach(function(row, index) {
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
function preprocess (value, index) {
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

function getPreferredLang(field) {
	var value =	context.doc[field]; 
	var lang = context.node.settings.preferred_lang;
	if(Array.isArray(value)) {		
		for(var i = 0; i < value.length; i++) {
			if(context.doc[field + "__lang"] && context.doc[field + "__lang"][i]) {
				if(context.doc[field + "__lang"][i] === lang) {
					output.push(preprocess(value[i]));
					return true;
				}
			}			
		}
	} else {
		if(context.doc[field + "__lang"]) {
			if(context.doc[field + "__lang"] === lang) {
				output.push(preprocess(value));
				return true;
			}
		}
	}
	return false;
}


if(Array.isArray(in_field)) {
	in_field.forEach(function(field) {
		if(context.node.settings.preferred_lang !== "" && getPreferredLang(field)) {
			
		} else {
			combine(field);
		}
	})
} else {
	var val = context.doc[context.node.settings.in_field]; 	
}


out.value = output;
