
var item = {"metadata": []};



function splitValue (val) { 
   if( typeof val == "string") { 
       var arr = val.split("||"); 
       return arr 
   } else if ( typeof val == "number") {
       return val; 
   }
}



function pushField (item, value, key_mapped, key_plain, language) {

	if(typeof value === "string")
		value = value.trim();

	// do not add key if there is no mapped key
	if(key_mapped.trim() != "" && value !== null && value !== "") { 
		// if array separator is set, then split values
		if(context.node.settings.array_separator != "") {
			
			var arr = splitValue(value);
			if(arr.constructor.name == "Array") {
				for(var i = 0; i < arr.length; i++) {
					var field = {"key": key_mapped, "value": arr[i], "language": language};
					item.metadata.push(field);
				}
			} else {
				var field = {"key": key_mapped, "value": value, "language": language};
				item.metadata.push(field);				
			}
			
		} else {
			
			var field = {"key": key_mapped, "value": value, "language": language};
			item.metadata.push(field);
		}
	}
}

// ready-made rest data
if(context.node.settings.rest_data) {
	var items = context.doc[context.node.settings.rest_data];
	items.forEach(function(item2) {
		item2.language = "";
	})
	out.pre_value = {"metadata":items};
	out.console.log("pre_value")
	out.console.log(out.pre_value)

// mapped data
} else {
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
	out.pre_value = item;
}



if(parseInt(context.count) % 10 == 0) 
    out.say("progress", context.node.type.toUpperCase() + ": processed " + context.count + "/" + context.doc_count);





