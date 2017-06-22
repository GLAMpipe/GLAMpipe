
// this outputs options objects for request module

var servers = [
	"https://commons.wikimedia.org",
	"https://commons.wikimedia.beta.wmflabs.org"
	]
var api = "/w/api.php?action=query&list=allimages&prop=imageinfo&format=json&aisha1=";


var server = servers[0];

if(context.node.params.server == "beta")
	server = servers[1];


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




