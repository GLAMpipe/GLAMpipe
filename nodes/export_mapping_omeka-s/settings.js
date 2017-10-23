
// dcterms
// http://localhost:8000/api/properties?pretty_print&vocabulary_id=1


// display current DSpace url nicely to user
$("#export-mapping-omeka_serverinfo").text("Mapping for \"" +node.params.required_url+ "\"");

// CREATE MAPPINGS

var ignoreFields = ["id", "_id", "collection", "__mp_source"];

mapping();

// TODO: because this is async, this script must handle remembering settings itself
// we fetch Omeka properties and first document from GLAMpipe for mapping
function mapping() {

   var url = g_apipath + "/collections/"+node.collection+"/docs?skip=0&limit=1";
   
	$.getJSON(g_apipath + "/proxy?url=" + node.params.required_url + "/properties", function (props) {
		$.getJSON(url, function(data) {
			var table = '<table><thead><tr><th>Omeka-S field</th><th>record field</th><th>static value</th></tr></thead>';
			if(props.error)
				alert(data.error);
			else {
				props.forEach(function(field) {
					//schema_select += "<option value='"+field['o:term']+"--"+field['o:id']+"'>" + field['o:term'] + "</options>"; 
					table += "<tr> <td>"+field['o:term']+"</td>";
					table += "<td><div><select name='_dynamic_" + field['o:term'] + "--"+field['o:id']+"' class='node-settings dynamic_field middle_input' ><option value=''>no value, use static</option></select></div></td>";
					table += "<td><div><input name='_static_" + field['o:term'] + "--"+field['o:id']+"' class='node-settings' value=''/></div></td> </tr>"; 
				})
				 
			}
			$("#export-web-omeka_mappings").empty().append(table);  
			
			var rec = data.data[0];
			var data_fields = "";
			for(var f in rec) {
				data_fields += "<option value='" + f + "'>" + f.replace("dc_", "dc.") + "</option>";
		   }
		   $("#export-web-omeka_mappings select").append(data_fields);
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

$("#xml_basic_guess").click(function(e){
   var obj=$(e.target);
   obj.parent().find("table tr").each(function(index) {
	   
	   var field = $( this ).find("td div").text();
	   field = field.replace(/_/g, ".");
	   $( this ).find("select").val(field).change();
	   
   });
});





