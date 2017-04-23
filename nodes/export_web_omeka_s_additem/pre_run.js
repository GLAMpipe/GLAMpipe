
var item = {}

function splitValue (val) { 
   if( typeof val == "string") { 
       var arr = val.split("||"); 
       return arr 
   } else if ( typeof val == "number") {
       return val; 
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

function pushField (item, value, key_mapped, key_plain, language) {

	if(typeof value === "string")
		value = value.trim();

	// do not add key if there is no mapped key
	if(key_mapped.trim() != "" && value !== null && value !== "") { 

			
		//var field = {"key": key_mapped, "value": value, "language": language};
		var field_splitted = key_mapped.split("--");
		var field_id = field_splitted[1];
		var field_name = field_splitted[0];
		
		var field = {"@value": value, "type":"literal", "property_id": field_id};
		if(item[field_name] && Array.isArray(item[field_name]))
			item[field_name].push(field);
		else
			item[field_name] = [field];
		
	}
}



for (mapkey in context.node.settings) {

	var language = "";
	// loop over keys that are mapped
	if(mapkey.indexOf("_mapkey_") != -1) {
		var key_plain = mapkey.replace("_mapkey_", "");
		var key_mapped = context.node.settings[mapkey];
		var value = context.doc[key_plain];

		// loop over value arrays
	   if (value != null && value.constructor.name === "Array") {
		   for (var i = 0; i < value.length; i++ ) { 
			   	if(context.doc[key_plain + "__lang"])
					language = context.doc[key_plain + "__lang"][i];
				pushField(item, value[i], key_mapped, key_plain, language);	
		   }
		   
	   } else { 
			if(context.doc[key_plain + "__lang"])
				language = context.doc[key_plain + "__lang"];
			pushField(item, value, key_mapped, key_plain, language);	
	   }
   }

} 



if(parseInt(context.count) % 10 == 0) 
    out.say("progress", context.node.type.toUpperCase() + ": processed " + context.count + "/" + context.doc_count);




out.setter = {"upload": item};
