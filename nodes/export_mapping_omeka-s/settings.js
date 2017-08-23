


// dcterms
// http://localhost:8000/api/properties?pretty_print&vocabulary_id=1

var schemas = null;
var schema_select = "<option value=''>none</option>";

// display current DSpace url nicely to user
$("#export-data-dspace_serverinfo").text("Login for \"" +node.params.required_url+ "\"");

// CREATE MAPPINGS

var ignoreFields = ["id", "_id", "collection", "__mp_source"];

mapping();



function mapping() {

   var url = g_apipath + "/collections/"+node.collection+"/docs?skip=0&limit=1";
   
	$.getJSON(g_apipath + "/proxy?url=" + node.params.required_url + "/properties", function (props) {
		
		var table = '<table><thead><tr><th>Omeka-S property</th><th>dynamic field</th><th>static field</th></tr></thead>';
		if(props.error)
			alert(data.error);
		else {
			props.forEach(function(field) {
				//schema_select += "<option value='"+field['o:term']+"--"+field['o:id']+"'>" + field['o:term'] + "</options>"; 
				table += "<tr> <td>"+field['o:term']+"</td>";
				table += "<td><div><select name='_dynamic_" + field['o:term'] + "' class='node-settings dynamic_field middle_input' ><option value=''>no value, use static</option></select></div></td>";
				table += "<td><div><input name='_static_" + field['o:term'] + "' class='node-settings' value=''/></div></td> </tr>"; 
			})
			 
		}
		$("#export-web-omeka_mappings").empty().append(table);  
   })
	   

}


$("#xml_basic_guess").click(function(e){
   var obj=$(e.target);
   obj.parent().find("table tr").each(function(index) {
	   
	   var field = $( this ).find("td div").text();
	   field = field.replace(/_/g, ".");
	   $( this ).find("select").val(field).change();
	   
   });
});




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



