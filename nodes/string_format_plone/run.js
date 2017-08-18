

record = {};
// dynamic values overrides static values
var is_static = /^_static_/;
var is_dynamic = /^_dynamic_/;

out

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

// handle dynamic fields
for(var key in context.node.settings) {
	if(is_dynamic.test(key)) {
		var plain_key = key.replace("_dynamic_", "");
		if(context.doc[context.node.settings[key]])
			setKey(plain_key, context.doc[context.node.settings[key]]);
	}
}


function setKey(key, value) {
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
