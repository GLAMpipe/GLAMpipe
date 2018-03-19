

	// place holder for node parameters
	//[[params]]
	var params = node.params
	var collections = [];
	var dspace_schema = [];


	// we must take care of settings remembering since schema is dynamically fetched
	getSchema(function(schemas) {
		if(node.settings.query_field && Array.isArray(node.settings.query_field) && node.settings.query_field.length !== 0) {
			
			if( node.settings.query_field.length === 1 && node.settings.query_field[0] == "") {
				schemaList(schemas);
			} else {	
				for(var i = 0; i < node.settings.query_field.length; i++) {
					if(node.settings.query_field[i])
						schemaList(schemas, node.settings.query_field[i],node.settings.query_op[i], node.settings.query_val[i])
				}
			}
		} else {
			schemaList(schemas);
		}
	})



	$("#source_web_dspace_selected").empty().append(collectionsfromQuery().join(""));
	$("#source_web_dspace_url").text(params.required_dspace_url);

	//$(document).on("click", "#source_web_dspace_fetch", function () {
	$(".source_web_dspace_fetch").click(function (e) {
		hierarchyList();
	})

	$("#source_web_dspace_unselect").click(function (e) {
		$("input.collection[type='checkbox']").prop("checked", false);
		createQuery();
	})

	// collection change handler
	$("#source_web_dspace_data").on("change", "input.collection:checkbox", function (event) {
		event.stopPropagation();
	})

	// collection click handler
	$("#source_web_dspace_data").on("click", "input.collection:checkbox", function (event) {
		createQuery();
	})
	
	// community click handler
	$("#source_web_dspace_data").on("click", "input.community:checkbox", function (event) {
		$(this).parent().children("ul").find(':checkbox').prop('checked', $(this).is(':checked'));
		$(this).parent().children("ul").find(':checkbox').change();
		createQuery();
	})

	$("setting").on("click", ".add_op", function() {
		if(dspace_schema.length === 0)
			alert("DSpace schemas not found!")
		else
			schemaList(dspace_schema);
	})

	$("setting").on("change", "select[name='query_field[]']", function() {
		createQuery()
	})

	$("setting").on("change", "select[name='query_op[]']", function() {
		createQuery()
	})

	$("setting").on("keyup", "input[name='query_val[]']", function() {
		createQuery()
	})



	// extract collection UUIDs from query string
	function collectionsfromQuery() {
		var collections = [];
		if(node.settings && node.settings.query) {
			var query = node.settings.query.replace("&expand=parentCollection,metadata,bitstreams", "");
			var collections = query.replace(/&/g, "").split("collSel[]=");
			collections.shift();
		}
		return collections;
	}

	function display (data, type) {
		var collections = collectionsfromQuery();
		var html = "<ul>";
		for(var i = 0; i < data.length; i++) {
			if(collections && collections.includes(data[i].id))
				html += "<li data-id='" + data[i].id + "'><input class='" +type+ "' type='checkbox' checked='checked'/><label>" + data[i].name + "</label>";
			else
				html += "<li data-id='" + data[i].id + "'><input class='" +type+ "' type='checkbox'/><label>" + data[i].name + "</label>";
			
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
		$("#source_web_dspace_data").append("<div class='bar'></div>");
		$.getJSON(g_apipath + "/proxy?url=" + params.required_dspace_url + "/hierarchy", function (data) {
			if(data.error)
				alert(data.error);
			else {
				var html = display(data.community, "community");
				$("#source_web_dspace_data").empty();
				$("#source_web_dspace_data").append(html);
				$("#source_web_dspace_data").show();
			}
			// update selected collections list
			collectCollections();
			//$("setting select[name='query_field[]']").prop('disabled', false);
		}).error(function() { alert("error in DSpace request!"); })
	}


	function getSchema(cb) {
		$.getJSON(g_apipath + "/proxy?url=" + params.required_dspace_url + "/registries/schema", function (schemas) {
			dspace_schema = schemas;
			cb(schemas);
		})
	}

	// metadata query inputs
	function schemaList(schemas, field, op, val) {
		var fields = "<div class='field-query'><select class='node-settings narrow' name='query_field[]'><option value=''>choose</option>"
		schemas.forEach(function(schema) {
			schema.fields.forEach(function(schema_field) {
				if(schema_field.name  == field)
					fields += "<option value='" + schema_field.name + "' selected='selected'>" + schema_field.name + "</option>";
				else
					fields += "<option value='" + schema_field.name + "'>" + schema_field.name + "</option>";
			})
		})
		fields += "</select>"
		
		fields += operators(op);
		if(val)
			fields += "<div><input class='node-settings narrow' name='query_val[]' value='"+val+"'/><a class='add_op'><i class='wikiglyph wikiglyph-plus'></i></a></div></div>";
		else
			fields += "<a class='add_op'><i class='wikiglyph wikiglyph-plus'></i></a><input class='node-settings' name='query_val[]' /></div>";
		
		$("#source_web_dspace_metadata_query").append(fields);
		//$("setting select[name='query_field[]']").prop('disabled', true);
	}


	function operators(op) {
		var operators = ["exists", "doesnt_exist", "equals", "not_equals", "like", "not_like", "contains", "doesnt_contain", "matches", "doesnt_match"];
		var op_labels = ["exists", "does not exist", "equals", "does not equal", "like", "not like", "contains", "does not contain", "matches", "does not match"];
		var ops="";
		if(!op)
			op = "equals";
			
		ops += "<select class=\"node-settings narrow\" name=\"query_op[]\">";
		for(var i = 0; i < operators.length; i++) {
			if(op && op === operators[i])
				ops += "	<option value='" + operators[i] + "' selected='selected'>" + op_labels[i] + "<\/option>";
			else
				ops += "	<option value='" + operators[i] + "'>" + op_labels[i] + "<\/option>";
		}
		ops += "</select>";
		return ops;
	}


	function createQuery() {
		var query = collectFieldQuery() + collectCollections();
		query = query.replace("&", "?");
		$("#source_web_dspace_query").val(query);
	}

	function collectCollections() {
		var collections = [];
		var collectionsList = [];
		$("input.collection:checkbox").each(function(i) {
			var collection_id = $(this).parent().data("id");
			if ($(this).is(':checked')) {
				collections.push("&collSel[]=" + collection_id);
				collectionsList.push("<div data-id='" + collection_id + "'>" + $(this).next("label").text() + "</div>");
			}
		})
		$("#source_web_dspace_selected").empty().append(collectionsList.join(""));
		return collections.join("") + "&expand=parentCollection,metadata,bitstreams";
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
		return query;

	}


