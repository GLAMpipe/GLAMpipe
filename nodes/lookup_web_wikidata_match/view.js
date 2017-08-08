
/*
* EXAMPLE OF VIEW SCRIPT
* - view script replaces default data table renderer
* - "node" is passed as a parameter to this script
* - "node.source.settings" includes node settings and "node.source.params" node's parameters
* - "node.data.docs" contains current (paged) set of documents
*/


// GLOBAL VARIABLES
console.log("view.js called");
var wikidata_url = "https://www.wikidata.org/wiki/";
var api_url = g_apipath + "/collections/" + node.source.collection + "/docs/";
html = "";

// HTML RENDERING

for(var i = 0; i < node.data.docs.length; i++) {
    var doc = node.data.docs[i];
    var title = doc[node.source.params.in_field];
    var result = doc[node.source.params.out_result];
    if(Array.isArray(result))
		result = result[0];  // we assume that we have only one search term

	html += "<table class='match' style='width:100%'><tr id='" + doc._id + "'><td style='width:20em'>";
    html += "<div class='fatbox'>";
    html += "  <div class='inlinetitleblock'><span class='title'>" + title + "</span></div>";
    html += "</div><div class='match debug'>SELECTED MATCH:" + doc[node.source.params.out_match] + "</div></td><td>";
    html += renderWDResult(result, doc) ;
    html += "<td></tr></table>";
}



// EVENT HANDLERS 

// off() is important since view.js gets called every time user clicks node
$("datablock").off().on("click", "button", function(e) {
	$(this).closest("table").find("tr").removeClass("selected-match");
	$(this).closest("tr").addClass("selected-match");
	setMatch($(this).data("match"), $(this).data("doc"));
	e.preventDefault();
})



// FUNCTIONS

function renderWDResult(result, doc) {

	if(result) {
		var html = "<table class='match-set' style='width:100%'>";
		for(var i = 0; i < result.length; i++) {
			var type = "";
			if(result[i]["type"] && Array.isArray(result[i]["type"]) && result[i]["type"].length && result[i]["type"][0]["name"])
				var type = result[i]["type"][0]["name"];
			
			
			var wikidata_id=doc[node.source.params.out_match];

			if(result[i].id==wikidata_id)
			{
				html += "<tr class='selected-match'>";
			}
			else if(result[i].score == "100" && wikidata_id == "null")
				html += "<tr class='good'>";
			else
				html += "<tr>";
				
			html += "<td>"+result[i].name+"</td>";
			html += "<td style='width:15em'> ["+type+"] </td>";
			html += "<td style='width:5em'>"+result[i].score+"</td>";
			html += "<td style='width:20em;text-align:right'><a target='_blank' href='" + wikidata_url + result[i].id + "'>"+result[i].id+"</a>&nbsp; ";
			html += "<button class='select-match' data-match='"+result[i].id+"' data-doc='"+doc._id+"' >select match</button></td>";
			html += "</tr>";
		}
		return html + "</table>";
	} 
	return "no matches";
}


function setMatch(match, doc) {
	var data = {};
	// field name can be found on node params
	data[node.source.params.out_match] = match;
	
	//data.field = node.source.params.out_match;
	//data.value = match;
	var url = api_url + doc;
	
	var options = {
		url: url,
		method: "POST",
		data: data
	}
	apiCall(options, doc);

}

function apiCall (options, doc) {
	// add auth
	options.headers = {"Authorization": "Bearer " + localStorage.getItem("token")}
	var post = $.ajax(options);
	post.done(function( msg ) {
		if(msg.error)
			alert(msg.error);
		else
			$("#" + doc + " .match").empty().append(options.data[node.source.params.out_match]);
		
	});
}

return html ;
