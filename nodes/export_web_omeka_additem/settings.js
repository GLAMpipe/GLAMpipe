
// dcterms
// http://localhost:8000/api/properties?pretty_print&vocabulary_id=1

var schemas = null;
var schema_select = "<option value=''>none</option>";

// display current DSpace url nicely to user
$("#export-data-dspace_serverinfo").text("Login for \"" +node.params.url+ "\"");

// CREATE MAPPINGS

var ignoreFields = ["id", "_id", "collection", "__mp_source"];

$("#xml_basic_fetch").click(function(e){

   var obj = $(e.target);
   var url = "/api/v1/collections/"+node.collection+"/docs?skip=0&limit=1";
   
   fetchSchemas(function () {
	   $.getJSON(url, function(data){
		   var rec = data.data[0];
		   var table = $('<table><th>current name</th><th>new name</th></table>');
		   for(var f in rec){
			   if(ignoreFields.indexOf(f) == -1 && f.indexOf("__lang") == -1) {
					//var field=$('<tr><td><div>' +f+ '</div></td><td><input class="node-settings" name="_mapkey_'+f+'"/></td></tr>');
					var field=$('<tr><td><div>' +f+ '</div></td><td><select class="node-settings" name="_mapkey_'+f+'">'+schema_select+'</select></td></tr>');
					table.append(field);
				}
		   }
		   $("#export-web-omeka_mappings").empty().append(table);
	   })	   
   })
	   

});


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

	$.getJSON("/api/v1/proxy?url=" + node.params.url + "/collections", function (data) {
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
$("#export-web-omeka_coll_list").on("click", "li", function (event) {
	event.stopPropagation();
	$("#export-web-omeka_collection").val($(this).data("id"));
	$("#export-web-omeka_coll_list").hide();
})


// CREATE SCHEMA LIST
function fetchSchemas (cb) {
	//http://localhost:8088/api/elements?pretty_print&element_set=1
	$.getJSON("/api/v1/proxy?url=" + node.params.url + "/elements", function (data) {
		if(data.error)
			alert(data.error);
		else {
			data.sort(sortByName);
			data.forEach(function(field) {
				schema_select += "<option value='" + field['id'] + "'>" + field['name'] + "</options>"; 
			})
			 
		}
		cb();
	})
}

	
function display (data) {
	var html = "<ul>";
	for(var i = 0; i < data.length; i++) {
		var title = getCollTitle(data[i]['element_texts']);
		html += "<li data-id='" + data[i]['id'] + "'>" + title + "</li>";

	}
	html += "</ul>";
	return html;
}

function getCollTitle (data) {
	for(var i = 0; i < data.length; i++) {
		if (data[i].element.name == "Title")
			return data[i].text;
	}
}

function sortByName (a,b) {
  if (a.name.toLowerCase() < b.name.toLowerCase())
    return -1;
  if (a.name.toLowerCase() > b.name.toLowerCase())
    return 1;
  return 0;	
}
