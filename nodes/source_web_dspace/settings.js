

	// place holder for node parameters
	//[[params]]
	var params = node.params
	var collections = [];

	$("#source_api_dspace_url").text(params.dspace_url);

	//$(document).on("click", "#source_api_dspace_fetch", function () {
	$("#source_api_dspace_fetch").click(function (e) {
		
		$("#source_api_dspace_data").empty();
		$("#source_api_dspace_data").append("<h3>Fetching...</h3>");
		$.getJSON("/api/v1/proxy?url=" + params.dspace_url + "/hierarchy", function (data) {
			if(data.error)
				alert(data.error);
			else {
				$("#source_api_dspace_data").append("<h2>"+data.name+"</h2>");
				var html = display(data.community, "community");
				$("#source_api_dspace_data").empty();
				$("#source_api_dspace_data").append(html);
				$("#source_api_dspace_data").show();
			}
		})
	})

	// collection change handler
	$("#source_api_dspace_data").on("change", "input.collection:checkbox", function (event) {
		event.stopPropagation();
	})

	// collection click handler
	$("#source_api_dspace_data").on("click", "input.collection:checkbox", function (event) {
		collectCollections();
	})
	
	// community click handler
	$("#source_api_dspace_data").on("click", "input.community:checkbox", function (event) {
		$(this).parent().children("ul").find(':checkbox').prop('checked', $(this).is(':checked'));
		$(this).parent().children("ul").find(':checkbox').change();
		collectCollections();
	})


	function collectCollections() {
		var collections = [];
		$("input.collection:checkbox").each(function(i) {
			var collection_id = $(this).parent().data("id");
			if ($(this).is(':checked')) {
				collections.push(collection_id);
			}
		})
		console.log("SELECTED COLLECTIONS:", collections);
		$("#source_api_dspace_handle").val(collections.join(","));
	}

	
	function display (data, type) {
		var html = "<ul>";
		for(var i = 0; i < data.length; i++) {
			html += "<li data-id='" + data[i].id + "'><input class='" +type+ "' type='checkbox'/>" + data[i].name;
			
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

