
if(!node.params.url)
	alert("Target DSpace address is missing! Re-create node and give url of the REST api.")

// display current DSpace url nicely to user
$("#export-data-dspace_serverinfo").text("Login for \"" +node.params.url+ "\"");

// CREATE MAPPINGS
var ignoreFields = ["id", "_id", "collection", "__mp_source"];

var url = g_apipath + "/collections/"+node.collection+"/docs?skip=0&limit=1";

$.getJSON(g_apipath + "/proxy?url=" + node.params.url + "/registries/schema", function (schemas) {
   $.getJSON(url, function(data){
	   var rec = data.data[0];
	   var table = $('<table><th>current field</th><th>target field</th></table>');
	   for(var f in rec){
		   if(ignoreFields.indexOf(f) == -1 && f.indexOf("__lang") == -1) {
				//var field=$('<tr><td><div>' +f+ '</div></td><td><input class="node-settings" name="_mapkey_'+f+'"/></td></tr>');
				var select = createOptions(schemas, f);
				var field=$('<tr><td><div>' +f+ '</div></td><td><select class="node-settings" name="_mapkey_'+f+'">'+select+'</select></td></tr>');
				table.append(field);
			}
	   }
	   $("#export_data_plone_mappings").empty().append(table);
   })	   
})  



$("#xml_basic_guess").click(function(e){
   var obj=$(e.target);
   obj.parent().find("table tr").each(function(index) {
	   
	   var field = $( this ).find("td div").text();
	   field = field.replace(/_/g, ".");
	   $( this ).find("select").val(field).change();
	   
   });
});




// CREATE COLLECTION LIST
$("#export_data_plone_fetch_collections").click(function (e) {
		
	$("#export_data_plone_coll_list").empty();
	$("#export_data_plone_coll_list").append("<h3>Fetching...</h3>");
	$("#export_data_plone_coll_list").show();
	
	if(!node.params.url) {
		alert("Target DSpace url is missing!")
		return;
	}

	$.getJSON(g_apipath + "/proxy?url=" + node.params.url + "/hierarchy", function (data) {
		if(data.error)
			alert(data.error);
		else {
			//$("#export_data_plone_coll_list").append("<h2>"+data.name+"</h2>");
			var html = display(data.community, "community");
			$("#export_data_plone_coll_list").empty().append(html);
		}
	})				
})



// collection click handler
$("#export_data_plone_coll_list").on("click", "li.collection", function (event) {
	event.stopPropagation();
	$("#export_data_plone_collection").val($(this).data("id"));
	$("#export_data_plone_coll_list").hide();
})



function createOptions (schemas, doc_field) {
	var schema_select = "<option value=''></option>";
	schemas.forEach(function(schema) {
		schema.fields.forEach(function(schema_field) {

			if(node.settings && node.settings["_mapkey_" + doc_field] && node.settings["_mapkey_" + doc_field] === schema_field.name)
				schema_select += "<option value='"+schema_field.name+"' selected>" + schema_field.name + "</options>"; 
			else
				schema_select += "<option value='"+schema_field.name+"'>" + schema_field.name + "</options>"; 
		})
	})
	return schema_select;
}
	
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

