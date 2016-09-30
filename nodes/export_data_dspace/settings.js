



// URL SELECTION
$("#export_data_dspace_url_pre").change(function(e){
	var url = $('#export_data_dspace_url_pre :selected').text();
	$('#export_data_dspace_url').val(url);
	
});

// CREATE MAPPINGS
	
	var ignoreFields = ["id", "_id", "collection", "__mp_source"];
	
   $("#xml_basic_fetch").click(function(e){
       var obj=$(e.target);
       var url="/get/collection/"+node.collection+"?skip=0&limit=1";
       $.getJSON(url, function(data){
           var rec = data.data[0];
           var table = $('<table><th>current name</th><th>new name</th></table>');
           for(var f in rec){
			   if(ignoreFields.indexOf(f) == -1 && f.indexOf("__lang") == -1) {
					var field=$('<tr><td><div>' +f+ '</div></td><td><input class="node-settings" name="_mapkey_'+f+'"/></td></tr>');
					table.append(field);
				}
           }
           obj.parent().append(table);
       })
   });
   
   $("#xml_basic_copy").click(function(e){
       var obj=$(e.target);
       obj.parent().find("table tr").each(function(index) {
		   
		   var field = $( this ).find("td div").text();
		   field = field.replace(/_/g, ".");
		   $( this ).find("input").val(field);
		   
       });
   });



// CREATE COLLECTION LIST


	$("#export_data_dspace_fetch").click(function (e) {
		
		var url = $('#export_data_dspace_url').val();
		if(url == "") {
			alert("You must give server address!");
		} else {
			$("#export_data_dspace_data").empty();
			$("#export_data_dspace_data").append("<h3>Fetching...</h3>");
			$.getJSON("/proxy?url=" + url + "/hierarchy", function (data) {
				if(data.error)
					alert(data.error);
				else {
					$("#export_data_dspace_data").append("<h2>"+data.name+"</h2>");
					var html = display(data.community, "community");
					$("#export_data_dspace_data").empty();
					$("#export_data_dspace_data").append(html);
					$("#export_data_dspace_data").show();
				}
			})
		}
	})



	// collection click handler
	$("#export_data_dspace_data").on("click", "li.collection", function (event) {
		event.stopPropagation();
		$("#export_data_dspace_collection").val($(this).data("id"));
		$("#export_data_dspace_data").hide();
	})
	
	
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

