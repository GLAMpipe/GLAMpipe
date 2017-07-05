
// "node" is passed as a parameter to this scripts
// "node.source.settings" includes node settings and "node.source.params" node's parameters
// "node.data.docs" contains current (paged) set of documents

var wikidata_url = "https://www.wikidata.org/wiki/";

html = "";


    
for(var i = 0; i < node.data.docs.length; i++) {
    var doc = node.data.docs[i];
    var title = doc[node.source.params.in_field];
    var result = doc[node.source.params.out_result];
    if(Array.isArray(result))
		result = result[0];  // we assume that we have only one search term

	html += "<table class='match-set'><tr><td>"
    html += "<div class='fatbox'>";
    html += "  <div class='inlinetitleblock'><span class='title'>" + title + "</span></div>";
    //html += "  <textarea class='big'>"+ doc[node.source.params.out_field] +"</textarea>";
   // html += "  <a target='_blank' href='" + preview_url + wikitext_url + "'><div class='button'>Preview wikitext</div></a>";
    html += "</div></td><td>";
    html += renderWDResult(result) ;
    html += "<td></tr></table>";
}



function renderWDResult(result) {

	if(result) {
		var html = "<table class='match-set'>";
		for(var i = 0; i < result.length; i++) {
			var type = "";
			if(result[i]["type"] && Array.isArray(result[i]["type"]) && result[i]["type"].length && result[i]["type"][0]["name"])
				var type = result[i]["type"][0]["name"];
				
			if(result[i].score == "100")
				html += "<tr class='good'>";
			else
				html += "<tr>";
				
			html += "<td>"+result[i].name+"</td>";
			html += "<td>"+type+"</td>";
			html += "<td>"+result[i].score+"</td>";
			html += "<td><a target='_blank' href='" + wikidata_url + result[i].id + "'>"+result[i].id+"</a></td>";
			html += "</tr>";
		}
		return html + "</table>";
	} 
	return "no matches";
}

$(".match-set").on("click", "a", function(e) {
	alert("pop");
	e.preventDefault();
})


return html ;
