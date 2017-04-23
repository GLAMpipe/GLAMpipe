
var item = {
			"item_type":1,
			"public": true,
			"tags": [],
			"element_texts": []
			}


function pushField (item, value, key_mapped, key_plain) {

	if(typeof value === "string")
		value = value.trim();

	// do not add key if there is no mapped key
	if(key_mapped.trim() != "" && value !== null && value !== "") { 
		
		var field = {"text": value, "html": false, "element": {"id": key_mapped}};
		item.element_texts.push(field);
		
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
				pushField(item, value[i], key_mapped, key_plain);	
		   }
		   
	   } else { 
			pushField(item, value, key_mapped, key_plain);	
	   }
   }

} 

// set collection
if(context.node.settings.collection  && context.node.settings.collection != "")
	item.collection = context.node.settings.collection;

// set tags
if(context.node.settings.tags && context.node.settings.tags != "") {
	var tags = context.node.settings.tags.split(",");
	item.tags = tags;
}


if(parseInt(context.count) % 10 == 0) 
    out.say("progress", context.node.type.toUpperCase() + ": processed " + context.count + "/" + context.doc_count);




out.setter = {"upload": item};
