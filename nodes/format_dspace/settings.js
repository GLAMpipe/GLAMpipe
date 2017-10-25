

// display current DSpace url nicely to user
$("#export-mapping-dspace_serverinfo").text("Mapping for \"" +node.params.required_url+ "\"");
$("#export-mapping-dspace_mappings").text("Fetching schemas from \"" +node.params.required_url+ "\"");



var ignoreFields = ["id", "_id", "collection", "__mp_source"];

mapping();

// TODO: because this is async, this script must handle remembering settings itself
// we fetch target properties and then we fetch first document from GLAMpipe for mapping
function mapping() {

   var url = g_apipath + "/collections/"+node.collection+"/docs?skip=0&limit=1";

	$.getJSON(g_apipath + "/proxy?url=" + node.params.required_url + "/registries/schema", function (schemas) {
		$.getJSON(url, function(data) {
			var table = '<table><thead><tr><th>Dspace field</th><th>dynamic field</th><th>static field</th></tr></thead>';

			schemas.forEach(function(schema) {
				schema.fields.forEach(function(schema_field) {

					//if(node.settings && node.settings["_mapkey_" + doc_field] && node.settings["_mapkey_" + doc_field] === schema_field.name)
						//schema_select += "<option value='"+schema_field.name+"' selected>" + schema_field.name + "</options>"; 
					//else
						//schema_select += "<option value='"+schema_field.name+"'>" + schema_field.name + "</options>"; 
					schema_field.name = schema_field.name.replace(/\./g, "_");
					table += "<tr> <td>" + schema_field.name + "</td>";
					table += "<td><div><select name='_dynamic_" + schema_field.name + "' class='node-settings dynamic_field middle_input' ><option value=''>no value, use static</option></select></div></td>";
					table += "<td><div><input name='_static_" + schema_field.name + "' class='node-settings' value=''/></div></td> </tr>"; 
				})
			})
			
			
			$("#export-mapping-dspace_mappings").empty().append(table);  
			
			// populate selects with document fields
			var rec = data.data[0];
			var data_fields = "";
			for(var f in rec) {
				//data_fields += "<option value='" + f + "'>" + f.replace("dc_", "dc.") + "</option>";
				data_fields += "<option value='" + f + "'>" + f + "</option>";
		   }
		   $("#export-mapping-dspace_mappings select").append(data_fields);
			setSettings();

		})
   })
	   

	

}


function setSettings() {
	var is_static = /^_static_/;
	var is_dynamic = /^_dynamic_/;
	console.log("setsettings")

	// apply settings to mappings (remembering previous run)
	for(var key in node.settings) {
		console.log(key)
		if(is_static.test(key)) {
			$("input[name='" + key + "']").val(node.settings[key]);
		}
		
		if(is_dynamic.test(key)) {
			$("select[name='" + key + "']").val(node.settings[key]);
		}
	}
}

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


$("#export-mapping-dspace-basic_guess").click(function(e){
	
   $(".settings table tr").each(function(index) {
	   
		var field = $( this ).find("td:first").text();
		field = field.replace(/\./g, "_");
		$( this ).find("select").val(field).change();
	   
   });
});

$("#export-mapping-dspace-show_mapped").click(function(e){
	
   $(".settings table tr").each(function(index) {
	   
		var dynamic = $( this ).find("select").val();
		var static = $( this ).find("input").val();
		if(!dynamic && !static)
			$(this).hide();
	   
   });
});

$("#export-mapping-dspace-show_all").click(function(e){
	
	$(".settings table tr").show();

});




