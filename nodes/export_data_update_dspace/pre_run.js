
// outputs an array of metadata objects

var uuid_value 		= context.doc[context.node.settings.uuid_field];
var update_value 	= context.doc[context.node.settings.update_field];
var original_value  = context.doc[context.node.settings.original_value];
var language_value 	= context.doc[context.node.settings.language_field];
var original_field 	= context.node.params.original_field; // field to be updated


out.value 		= [];


if(!uuid_value || !context.validator.isUUID(uuid_value+""))
	out.error = "UUID is not valid: " + uuid_value;


// if original value and new value are the same, then we do not update
if (context.node.settings.original_value && Array.isArray(update_value)) {

	var is_same = (update_value.length == original_value.length) && update_value.every(function(element, index) {
		return element === original_value[index]; 
	});

	if(is_same) {
		out.value = null;
		out.url = null;
		out.console.log("FUCK");
	} else {
		out.console.log("setting values")
		createNewVal(out.value);
		out.console.log(out.value)
		out.url =  context.node.params.dspace_url + "/items/" + uuid_value + "/metadata";
	}
	
} else {
// create new metadata object
	createNewVal(out.value);

	out.url =  context.node.params.dspace_url + "/items/" + uuid_value + "/metadata";
}



// FUNCTIONS

// input can be an array or primitive value
function createNewVal (metadata) {
	if(update_value && Array.isArray(update_value)) {
		
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
}

function getLanguageValue (language, index) {
	// if index is given (i.e. input is array), we try to get correspondent index from language
	if(typeof index !== "undefined" && language && Array.isArray(language)) {
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


