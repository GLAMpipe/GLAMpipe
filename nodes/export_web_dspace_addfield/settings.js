
var dataDisplay = "#export_data_dspace_schema_add_field_display";
var fetchButton = "#export_data_dspace_schema_add_field_fetch";
var urlInput = "#export_data_dspace_schema_add_field_url";

$("#server_url").text(node.params.url);
fetchSchemas(node.params.url)

// CREATE SCHEMA LIST
function fetchSchemas (url) {
	
	if(url == "") {
		alert("You must give server address!");
	} else {
		$(dataDisplay).empty();
		$(dataDisplay).append("<h3>Fetching...</h3>");
		$.getJSON("/api/v1/proxy?url=" + url + "/registries/schema", function (data) {
			if(data.error)
				alert(data.error);
			else {
				var html = "<ul>";
				data.forEach(function(schema) {
					html += "<li>" + schema.prefix + "</li>"; 
				}) 
				html += "</ul>"

				$(dataDisplay).empty();
				$(dataDisplay).append(html);
				$(dataDisplay).show();
			}
		})
	}
}




