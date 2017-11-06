

	// place holder for node parameters
	//[[params]]
	var params = node.params
	var collections = [];

	$("#source_web_dspace_url").text(params.required_dspace_url);

	hierarchyList();
	if(node.settings) {
		
	} else {
		schemaList();
	}

	//$(document).on("click", "#source_web_dspace_fetch", function () {
	$("#source_web_dspace_fetch").click(function (e) {
		hierarchyList();
	})

	// collection change handler
	$("#source_web_dspace_data").on("change", "input.collection:checkbox", function (event) {
		event.stopPropagation();
	})

	// collection click handler
	$("#source_web_dspace_data").on("click", "input.collection:checkbox", function (event) {
		collectCollections();
	})
	
	// community click handler
	$("#source_web_dspace_data").on("click", "input.community:checkbox", function (event) {
		$(this).parent().children("ul").find(':checkbox').prop('checked', $(this).is(':checked'));
		$(this).parent().children("ul").find(':checkbox').change();
		collectCollections();
	})


	function collectCollections() {
		var collections = [];
		$("input.collection:checkbox").each(function(i) {
			var collection_id = $(this).parent().data("id");
			if ($(this).is(':checked')) {
				collections.push("&collSel[]=" + collection_id);
			}
		})
		var query = "?&query_field[]=*&query_op[]=exists&query_val[]=" + collections.join("") + "&expand=parentCollection,metadata,bitstreams&filters=none";
		$("#source_web_dspace_query").val(query);
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



	function hierarchyList() {
		$("#source_web_dspace_data").empty();
		$("#source_web_dspace_data").css('visibility', 'visible');
		$("#source_web_dspace_data").append("<h3>Fetching...</h3>");
		$.getJSON(g_apipath + "/proxy?url=" + params.required_dspace_url + "/hierarchy", function (data) {
			if(data.error)
				alert(data.error);
			else {
				var html = display(data.community, "community");
				$("#source_web_dspace_data").empty();
				$("#source_web_dspace_data").append(html);
				$("#source_web_dspace_data").show();
			}
		})
	}




	function schemaList() {
		$.getJSON(g_apipath + "/proxy?url=" + params.required_dspace_url + "/registries/schema", function (schemas) {
			var fields = "<div class='field-query'><select class='node-settings narrow' name='query_field[]'><option value=''>choose</option>"
			schemas.forEach(function(schema) {
				schema.fields.forEach(function(schema_field) {
					fields += "<option value='" + schema_field.name + "'>" + schema_field.name + "</option>";
				})
				
				
				
			})
			fields += "</select>"
			
			fields += operators();
			fields += "<input class='node-settings narrow' name='query_val[]' /><a class='ibutton add_op'> + </a></div>";
			
			$("#source_web_dspace_metadata_query").append(fields);
		})
	}


function operators() {
	var ops="";
	ops += "		<select class=\"node-settings narrow\" name=\"query_op[]\">";
	ops += "			<option value=\"exists\">exists<\/option>";
	ops += "			<option value=\"doesnt_exist\">does not exist<\/option>";
	ops += "			<option selected=\"\" value=\"equals\">equals<\/option>";
	ops += "			<option value=\"not_equals\">does not equal<\/option>";
	ops += "			<option value=\"like\">like<\/option>";
	ops += "			<option value=\"not_like\">not like<\/option>";
	ops += "			<option value=\"contains\">contains<\/option>";
	ops += "			<option value=\"doesnt_contain\">does not contain<\/option>";
	ops += "			<option value=\"matches\">matches<\/option>";
	ops += "			<option value=\"doesnt_match\">does not match<\/option>";
	ops += "		<\/select>";
	return ops;
}



	function collectFieldQuery() {
		var query = "";
		$(".field-query").each(function() {
			
			// use only if field is chosen
			if( $(this).find("select[name='query_field[]']").val()) {
				query += "&query_field[]=" + $(this).find("select[name='query_field[]']").val();
				query += "&query_op[]=" + $(this).find("select[name='query_op[]']").val();
				query += "&query_val[]=" + $(this).find("input[name='query_val[]']").val();
			}
		})
		
		query = query.replace("&", "?");
		$("#source_web_dspace_query").val(query);
	}

	$("setting").on("click", ".add_op", function() {
		schemaList();
	})

	$("setting").on("change", "select", function() {
		collectFieldQuery();
	})

	$("setting").on("keyup", "input", function() {
		collectFieldQuery();
	})
