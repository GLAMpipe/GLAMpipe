
var dataHolder = function () {
	var self = this;
	this.workspaceDiv = "dataspace"

	this.getAndRenderData = function (node) {
		var html = "<table id='data' class='display'><thead><tr>";

		$.getJSON("/get/collection/fields/" + node.collection, function(data) {
			
			if(data == null)
				alert("error");
			else {
				var keys = [];
				for (key in data) {
					// do not display keys starting with "_" like "_id" and "_mp_source"
					if(key[0] != "_") {
						html += "<td>" + key + "</td>"
						keys.push({"data": key});
					}
				}
				html += "</tr></thead><tbody>"
				
				html += "</tbody></table>" 
				$("workspace").append(html);
				self.initDataTable(node, keys);

			}
		})
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
