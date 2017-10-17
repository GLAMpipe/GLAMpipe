
// display current Omeka url nicely to user
$("#export-web-omeka_serverinfo").text(node.params.required_url);

// load item sets and render them
getItemSets();

// reload item set list
$("#export-web-omeka_fetch_sets").click(function (e) {
	getItemSets();
})




function getItemSets() {
	$("#export-web-omeka_sets").empty().append("<option>fetching...</option>");

	$.getJSON(g_apipath + "/proxy?url=" + node.params.required_url + "/item_sets", function (data) {
		if(data.error)
			alert(data.error);
		else {
			var html = display2(data);
			$("#export-web-omeka_sets").empty().append(html);
		}
	})	
}

function display2 (data) {
	var html = "<option value=''>choose item set</option>";
	for(var i = 0; i < data.length; i++) {
		html += "<option data-id='" + data[i]['o:id'] + "'>" + data[i]['dcterms:title'][0]['@value'] + "</option>";
	}
	return html;
}
