var c = context; 
var url = 'https://query.wikidata.org/sparql?format=json&query='; 
var search = context.node.settings.search; 
c.var = {}; 
c.var.total_count = 0;

// we simplly split URL and use the latter part for SPARQL endpoint
var query = search.split('/#'); 
if (query.length == 2) { 
    out.url = url + query[1];
} else { 
    out.say('error', 'Query seems to be invalid, please make sure you copy it right.'); 
}

