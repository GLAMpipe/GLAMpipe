
// outputs an array of metadata objects

var uuid_value 		= context.doc[context.node.settings.in_uuid_field];
var update_value 	= context.doc[context.node.settings.in_update_field];
var language_value 	= context.doc[context.node.settings.dynamic_language_field];
var original_value  = context.doc[context.node.settings.in_field];
var original_field 	= context.node.params.in_field.replace(/_/g, "."); // field to be updated


var update = [];
var url =  context.node.params.required_url + "/items/" + uuid_value + "/metadata";


if(!uuid_value || !context.validator.isUUID(uuid_value+""))
	out.error = "UUID is not valid: " + uuid_value;

// if original value is provided, then we update only when there is a difference between values
if (context.node.params.in_original_value && Array.isArray(update_value) &&  Array.isArray(original_value)) {

	var is_same = (update_value.length == original_value.length) && update_value.every(function(element, index) {
		return element === original_value[index]; 
	});

	if(is_same) {
		context.skip = true;
		update = null;
	} else {
		createNewVal(update);
		
	}
// else just update
} else {
// create new metadata object
	createNewVal(update);

}



out.pre_value = {
	url: url,
	json: update,
	method: "put",
	jar:true
};


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


