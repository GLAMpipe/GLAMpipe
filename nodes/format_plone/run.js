

record = {};
// dynamic values overrides static values
var is_static = /^_static_/;
var is_dynamic = /^_dynamic_/;


// handle static fields
for(var key in context.node.settings) {
	if(is_static.test(key)) {
		var plain_key = key.replace("_static_", "");
		if(context.node.settings[key])
			setKey(plain_key, context.node.settings[key]);
		else if(context.node.settings.mode === "allways")
			setKey(plain_key, "");
	}
}

// then override with dynamic fields if set
for(var key in context.node.settings) {
	var value = context.doc[context.node.settings[key]];
	if(is_dynamic.test(key)) {
		var plain_key = key.replace("_dynamic_", "");
		if(context.doc[context.node.settings[key]])
		// if static field is array, then we do not join array
			if(Array.isArray(record[plain_key]) && Array.isArray(value))
				setKey(plain_key, value);
			else if(Array.isArray(value))
				setKey(plain_key, value.join(context.node.settings.join));
			else
				setKey(plain_key, value);
				
	}
}


function setKey(key, value) {
	if(value === "[]")
		value = [];
		
	if(key.indexOf("--") !== -1) { // dotted value must be trasformed to an object
		var splitted_key = key.split("--");
		
		if(!record[splitted_key[0]]) {
			record[splitted_key[0]] = {};
		}
		record[splitted_key[0]][splitted_key[1]] = value;
		
	} else {
		record[key] = value;
	}
}



out.value = record;  
