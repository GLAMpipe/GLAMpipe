
var mapping = context.data;
var local_key = context.doc[context.node.params.in_field];
var output = [];

//context.node.params.key_field = "key";
//context.node.params.copy_field = "value";

if(Array.isArray(local_key)) {
	local_key.forEach(function(val) {
		if(typeof val === "string")
			output.push(map(val.trim()))
		else
			output.push(map(val))
	})
} else {
	output = map(local_key);
}

out.value = output;


// TODO: repaire mapping

// we expect that mapping data has string key or arrays with length 1 key
function map(key) {
	for(var i = 0; i < mapping.length; i++) {
		var map_key = mapping[i][context.node.params.key_field];
		var map_value = mapping[i][context.node.params.copy_field];
		if(Array.isArray(map_key)) {
			map_key = map_key[0];
		}
		if(Array.isArray(map_value)) {
			map_value = map_value[0];
		}
		
		if(typeof map_key === "string")
			map_key = map_key.trim();
			
		if(key === map_key) {
			return map_value;
		} 
	}
	// if no matches, then return original key
	if(context.node.settings.copy)
		return key;
	else
		return "";
}


