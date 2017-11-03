



mapping();

// TODO: because this is async, this script must handle remembering settings itself
// we fetch target properties and then we fetch first document from GLAMpipe for mapping
function mapping() {

	var url = g_apipath + "/collections/"+node.collection+"/fields";

	$.getJSON(url, function (fields) {

		var table = '<a href="#" class="ibutton" id="export-file-csv_toggle">toggle selection</a><table><thead><tr><th>Field</th></tr></thead>';

		fields.sorted.forEach(function(field) {


			table += "<tr> <td> <input class='node-settings' type='checkbox' checked='checked' name='fields["+field+"]'/> " + field + "</td>";
	
		})
		table += "</table>";
		
		$("#export-file-csv_fields").html(table);

	})
}
