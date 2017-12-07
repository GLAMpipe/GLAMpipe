
$.getJSON(g_apipath + "/collections/" + node.params.required_source_collection + "/fields", function (data) {
	var html = "";
	for (var i = 0; i < data.sorted.length; i++) {
		if(data.sorted[i] == "__mp_source" || data.sorted[i] == "_id")
			continue;
			
		if(node.settings && node.settings.lookup_key_field === data.sorted[i])
			html += "<option  value='" + data.sorted[i] + "' selected='selected'>" + data.sorted[i] + "</option>";
		else
			html += "<option  value='" + data.sorted[i] + "'>" + data.sorted[i] + "</option>";

	}
	$('#lookup-key-field').append(html);
	
	html = "";
	for (var i = 0; i < data.sorted.length; i++) {
		if(data.sorted[i] == "__mp_source" || data.sorted[i] == "_id")
			continue;
			
		if(node.settings && node.settings.lookup_copy_field === data.sorted[i])
			html += "<option  value='" + data.sorted[i] + "' selected='selected'>" + data.sorted[i] + "</option>";
		else
			html += "<option  value='" + data.sorted[i] + "'>" + data.sorted[i] + "</option>";

	}
	$('#lookup-copy-field').append(html);
})
