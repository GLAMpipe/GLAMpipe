
// outputs an array of metadata objects

var update_value = context.doc[context.node.params.update_field];
var language_value = context.doc[context.node.params.language_field];
var original_field = context.node.params.original_field;
var original_value = context.doc[original_field];

var metadata = [];


function getLanguageValue (language, index) {
	// if index is given (i.e. input is array), we try to get correspondent index from language
	if(index && language && language.constructor.name === "Array") {
		if(language[index])
			return language[index];
		else 
			return ""; // if that fails, then we return empty string
			
	// if there is no index, then return language value
	} else {
		if(language)
			return language;
		else
			return "";
	} 
}

if(context.node.params.convert)
	original_field = original_field.replace(/_/g, ".");

// input can be an array or primitive value
if(update_value && update_value.constructor.name == "Array") {
	
	for (var i = 0; i < update_value.length; i++) {
		
		var lang = getLanguageValue(language_value, i);
		var meta = {"key": original_field, "value":update_value[i], "language": lang};
		metadata.push(meta);		
	}
	
} else {
	
	var lang = getLanguageValue(language_value);
	var meta = {"key": original_field, "value":update_value, "language": lang};
	metadata.push(meta);
} 

out.value = metadata;
out.url =  context.node.settings.url + "/items/" + context.doc.uuid + "/metadata";
