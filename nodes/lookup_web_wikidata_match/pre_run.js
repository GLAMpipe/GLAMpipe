
// https://tools.wmflabs.org/openrefine-wikidata/en/api?query={%22query%22:%22Jyv%C3%A4skyl%C3%A4n%20yliopisto%22}
var url = context.node.params.service_url;
var apipath = "/en/api?query=";
var match_terms = context.doc[context.node.params.in_field];
out.pre_value = [];

var headers = {
	"User-Agent": "GLAMpipe",
	"Accept": "applications/json"
}

if(Array.isArray(match_terms)) {
	match_terms.forEach(function(term) {
		var query = {query:term};
		var options = {url: url + apipath + encodeURIComponent(JSON.stringify(query)), headers: headers}
		out.pre_value.push(options);
	});
} else {
	var query = {query: match_terms};
	var options = {url: url + apipath + encodeURIComponent(JSON.stringify(query)), headers: headers}
	out.pre_value.push(options);
}




