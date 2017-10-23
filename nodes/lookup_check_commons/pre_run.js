
// this outputs options objects for request module

var servers = {
	"beta":			"https://commons.wikimedia.beta.wmflabs.org", 
	"production": 	"https://commons.wikimedia.org"
	}; 
	
var server = servers[context.node.params.server];
var api = "/w/api.php?action=query&list=allimages&prop=imageinfo&format=json&aisha1=";

var values = context.doc[context.node.params.in_field];

if(Array.isArray(values)) {
	var outputs = [];
	values.forEach(function(value) {
		var options = {
			url: server + api + value,
			method: 'GET'
		}
		outputs.push(options);
	})
	
	out.pre_value = outputs;
	
} else {
	var options = {
		url: server + api + context.doc[context.node.params.in_field],
		method: 'GET'
	}
	
	out.pre_value = options;
}




