
// URL of JSON file uploaded by the user
var url = g_apipath + "/upload/" + node.params.filename;

$.getJSON(url, function(data){

	var tr;
	var td;
	var nodes = [];
	$("#import-nodes_result").empty();
	
	if(data) {
		data.nodes.forEach(function(node) {
			if(node.type != "collection") {
				var table=$("<table>");
				tr = $("<tr>");
				tr.append("<td>" + node.nodeid + "<br>" +node.collection + "</td>");
				var params = $("<td>");
				for(key in node.params) {
					params.append("<div><strong>" + key + "</strong>: " + node.params[key] + "</div>")
				}
				tr.append(params);
				tr.append("<td style='width:300px'><div class='fatbox process'>" + node.views.params + "<a href='#' data-id='"+node.nodeid+"' class='button create-node'>Create node</a></div></td>");
				table.append(tr);
				$("#import-nodes_result").append("<h2>" + node.description + "</h2>");
				$("#import-nodes_result").append(table);
			}
		})
	}
	
	setDynamicKeys();
});


$("settingsblock").off().on("click", ".button", function(e) {
	var data = {params:{}};
	data.collection = node.collection;
	
	//var nodeid = $(this).parent().next().text();
	var nodeid = $(this).data("id");
	var url = g_apipath + "/projects/" + node.project + "/nodes/" + nodeid;

	// read params
	$(this).closest("table").find("input,textarea, select").not("input[type=button]").each(function(){
		if($(this).attr("type") == "checkbox") {
			if($(this).is(':checked'))
				data.params[$(this).attr("name")] = "on"; 
		} else {
			data.params[$(this).attr("name")] = $(this).val(); 
		}
	});

	$.post(url, data, function(result) {
		alert("done");
		console.log(result);
	})
	e.preventDefault();
})

function setDynamicKeys() {
	$.getJSON(g_apipath + "/collections/" + node.collection + "/schema", function(data) {
		console.log(data)
		var selectKeys = "";
		if(data && data.keys) {
			data.keys.forEach(function(key) {
				selectKeys += "<option>" + key + "</option>";
			})
			$("#import-nodes_result select.dynamic_field").append(selectKeys);
		}
	})
}

