

var item = {"metadata": []};
out.value = item;
context.success_count++;

var is_static = /^_static_/;
var is_dynamic = /^_dynamic_/;


// handle static fields
for(var key in context.node.settings) {
	if(is_static.test(key)) {
		var plain_key = key.replace("_static_", "");
		if(context.node.settings[key])
			pushField(item, plain_key, "");
	}
}

// then override with dynamic fields if set
for(var key in context.node.settings) {
	var value = context.doc[context.node.settings[key]];
	// value might be undefined
	if(!value)
		value = "";
		
	var language = "";
	
	if(is_dynamic.test(key)) {
		
		var plain_key = key.replace("_dynamic_", "");
		if(context.doc[context.node.settings[key]])

		   if(Array.isArray(value)) {
			   for (var i = 0; i < value.length; i++ ) { 
					if(context.doc[plain_key + "__lang"])
						language = context.doc[plain_key + "__lang"][i];
					pushField(item, value[i], plain_key, language);	
			   }
		   } else { 
				if(context.doc[plain_key + "__lang"])
					language = context.doc[plain_key + "__lang"];
				pushField(item, value, plain_key, language);	
		   }
	}
}



if(parseInt(context.count) % 10 == 0) 
    out.say("progress", context.node.type.toUpperCase() + ": processed " + context.count + "/" + context.doc_count);



/*********************** FUNCTIONS *********************/

function splitValue (val) { 
   if( typeof val == "string") { 
       var arr = val.split("||"); 
       return arr 
   } else if ( typeof val == "number") {
       return val; 
   }
}



function pushField (item, value, key, language) {

	if(typeof value === "string")
		value = value.trim();

	key = key.replace(/_/g, ".");

	// do not add key if there is no mapped key
	if(value !== null && value !== "") { 
		// if array separator is set, then split values
		if(context.node.settings.array_separator != "") {
			
			var arr = splitValue(value);
			if(arr.constructor.name == "Array") {
				for(var i = 0; i < arr.length; i++) {
					var field = {"key": key, "value": arr[i], "language": language};
					item.metadata.push(field);
				}
			} else {
				var field = {"key": key, "value": value, "language": language};
				item.metadata.push(field);				
			}
			
		} else {
			
			var field = {"key": key, "value": value, "language": language};
			item.metadata.push(field);
		}
	}
}




