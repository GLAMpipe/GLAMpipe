


// display current DSpace url nicely to user
$("#export-data-dspace_serverinfo").text("Login for \"" +node.params.required_url+ "\"");


$("#xml_basic_guess").click(function(e){
   var obj=$(e.target);
   obj.parent().find("table tr").each(function(index) {
	   
	   var field = $( this ).find("td div").text();
	   field = field.replace(/_/g, ".");
	   $( this ).find("select").val(field).change();
	   
   });
});




// CREATE COLLECTION LIST
$("#export_data_dspace_fetch_collections").click(function (e) {
		
	$("#export_data_dspace_coll_list").empty();
	$("#export_data_dspace_coll_list").append("<h3>Fetching...</h3>");
	$("#export_data_dspace_coll_list").show();
	
	if(!node.params.required_url) {
		alert("Target DSpace url is missing!")
		return;
	}

	$.getJSON(g_apipath + "/proxy?url=" + node.params.required_url + "/hierarchy", function (data) {
		if(data.error)
			alert(data.error);
		else {
			//$("#export_data_dspace_coll_list").append("<h2>"+data.name+"</h2>");
			var html = display(data.community, "community");
			$("#export_data_dspace_coll_list").empty().append(html);
		}
	})				
})



// collection click handler
$("#export_data_dspace_coll_list").on("click", "li.collection", function (event) {
	event.stopPropagation();
	$("#export_data_dspace_collection").val($(this).data("id"));
	$("#export_data_dspace_coll_list").hide();
})




	
function display (data, type) {
	var html = "<ul>";
	for(var i = 0; i < data.length; i++) {
		html += "<li class='"+type+"' data-id='" + data[i].id + "'>" + data[i].name;
		
		// handle subcommunities array
		if(data[i].community && data[i].community.constructor.name == "Array" ) {
				html += display(data[i].community, "community");
		// handle single subcommunity
		} else if (data[i].community) {
				html += display([data[i].community], "community");
		}

		// handle collections array
		if(data[i].collection && data[i].collection.constructor.name == "Array" ) {
				html += display(data[i].collection, "collection");
		// handle single collection
		} else if (data[i].collection) {
				html += display([data[i].community], "collection");
		}


		
		html += "</li>";
	}
	html += "</ul>";
	return html;
	
	
}

