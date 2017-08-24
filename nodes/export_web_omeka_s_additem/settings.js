


// display current Omeka url nicely to user
$("#export-web-omeka_serverinfo").text("Login for \"" +node.params.required_url+ "\"");


// CREATE COLLECTION LIST
$("#export-web-omeka_fetch_collections").click(function (e) {
		
	$("#export-web-omeka_coll_list").empty();
	$("#export-web-omeka_coll_list").append("<h3>Fetching...</h3>");
	$("#export-web-omeka_coll_list").show();

	$.getJSON(g_apipath + "/proxy?url=" + node.params.required_url + "/item_sets", function (data) {
		if(data.error)
			alert(data.error);
		else {
			//$("#export-web-omeka_coll_list").append("<h2>"+data.name+"</h2>");
			var html = display(data);
			$("#export-web-omeka_coll_list").empty().append(html);
		}
	})
})



// collection click handler
$("#export-web-omeka_coll_list").on("click", "li.set", function (event) {
	event.stopPropagation();
	$("#export-web-omeka_collection").val($(this).data("id"));
	$("#export-web-omeka_coll_list").hide();
})



	
function display (data) {
	var html = "<ul>";
	for(var i = 0; i < data.length; i++) {
		html += "<li class='set' data-id='" + data[i]['o:id'] + "'>" + data[i]['dcterms:title'][0]['@value'] + "</li>";

	}
	html += "</ul>";
	return html;
	
	
}

