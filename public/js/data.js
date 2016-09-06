
var dataHolder = function () {
	var self = this;
	this.workspaceDiv = "dataspace"

	this.getAndRenderData = function (node) {
		
			
		$.getJSON("/get/collection/" + node.collection + "/fields", function(keys) {
			

			if(keys == null) {
				alert("collection keys not found");
				return;
			}
			
			var visible_keys = [];
			if(node.visible_keys && node.visible_keys.length > 0)
				visible_keys = node.visible_keys;
			else if (node.views.default_keys)
				visible_keys = node.views.default_keys;

			console.log("VISIBLE KEYS:", visible_keys);

			// options for field selector
			var options = "<option>visible fields</option><option value='*'>all fields (*)</option>";
			for (var i = 0; i < keys.sorted.length; i++) {
				options += "<option value='" + keys.sorted[i] + "'>" + keys.sorted[i] + "</option>";		
			}					
			
			var html = "<table id='data' class='documents'><thead><tr>";
			
			// RENDER KEYS
			for (var i = 0; i < visible_keys.length; i++) {
				html += "<td>" +  visible_keys[i] + " <span class='wikiglyph wikiglyph-cross icon boxicon'></span></td>";
			}
			
			html += "</tr></thead><tbody>"
			
			// RENDER DATA
			$.getJSON("/get/collection/" + node.collection, function (docs) {

				html += self.renderData(docs, visible_keys);
				
				html += "</tbody></table>" ;
				
				// APPEND TABLE
				$("workspace data").empty();
				$("workspace data").append("<select id='field-selector'>" + options + "<select>");
				$("workspace data").append("<div id='selected_fields'></div>");
				$("workspace data").append(html);
				
			}); 
		})
	
	}



	this.renderData = function (docs, keys) {

		var html = "";
		for(var j = 0; j < docs.data.length; j++) {
			html += "<tr>";
			for(var k = 0; k < keys.length; k++) {
				
				if(docs.data[j][keys[k]]) {
					
					if(docs.data[j][keys[k]].constructor.name == "Array") {
						html += "<td>";
						for(var l = 0; l < docs.data[j][keys[k]].length; l++) {
							html += "<div><span>["+l+"] </span> " + docs.data[j][keys[k]][l] + "</div>";	
						}
						html += "</td>";
					} else
						html += "<td><div>" + docs.data[j][keys[k]] + "</div></td>";
					
				} else {
					html += "<td><div><div></td>";
				}
			}
			html += "</tr>";
			
		}

		return html;

	}

	this.initDataTable = function (node, keys) {

		$('#data').DataTable( {
			"processing": true,
			"serverSide": false,
			"ajax": "/get/collection/" + node.collection + "?limit=15",
			"columns": keys
		})
	}

	this.renderData2 = function () {

	}


	this.renderData3 = function () {

	}


	this.loadNodes = function () {
		$.getJSON("/get/nodes", function(data) { 
			for(var i = 0; i< data.length; i++) {
				self.nodes.push(data[i]);
			}
		})
	}



}
