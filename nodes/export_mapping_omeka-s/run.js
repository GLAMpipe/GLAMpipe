

record = {};
// dynamic values overrides static values
var is_static = /^_static_/;
var is_dynamic = /^_dynamic_/;


// handle static fields
for(var key in context.node.settings) {
	if(is_static.test(key)) {
		var plain_key = key.replace("_static_", "");
		if(context.node.settings[key])
			pushField(record, context.node.settings[key], plain_key);
	}
}

// then override with dynamic fields if set
for(var key in context.node.settings) {
	var value = context.doc[context.node.settings[key]];
	if(is_dynamic.test(key)) {
		var plain_key = key.replace("_dynamic_", "");
		if(context.doc[context.node.settings[key]])

			if(Array.isArray(value)) {
				for(var i = 0; i < value.length; i++) {
					pushField(record, value[i], plain_key);
				}
			} else
				pushField(record, value, plain_key);
				
	}
}





/*
    "dcterms:title": [
        {
            "type": "literal",
            "property_id": 1,
            "property_label": "Title",
            "@value": "Dear API, please save me!"
        }
    ],
*/

function pushField (item, value, key_omeka) {

	if(typeof value === "string")
		value = value.trim();

	//var field = {"key": key_mapped, "value": value, "language": language};
	
	// separate property id and property name
	var field_splitted = key_omeka.split("--");
	var field_id = field_splitted[1];
	var field_name = field_splitted[0];
	
	var field = {"@value": value, "type":"literal", "property_id": field_id};
	if(item[field_name] && Array.isArray(item[field_name]))
		item[field_name].push(field);
	else
		item[field_name] = [field];
		
	
}


out.value = record;  
