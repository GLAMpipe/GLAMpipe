

var api = "https://api.finna.fi/api/v1/search?type=AllFields&sort=relevance&page=1&limit=20&prettyPrint=true&lookfor="



var values = context.doc[context.node.settings.in_field];
var query_type = context.node.settings.query_type;

// if input is array, then we output array 
if(Array.isArray(values)) {
	var outputs = [];
	values.forEach(function(value) {
		outputs.push(api + query_type + ":" + value);
	})
	
	out.pre_value = outputs;
	
} else {
	
	out.pre_value = api + query_type + ":" + values;
}




