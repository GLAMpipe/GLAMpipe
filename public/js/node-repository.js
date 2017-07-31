
var nodeRepository = function () {
	var self = this;
	this.nodes = []
	this.plainNodes = []
	this.baseAPI = "/api/v1";
	this.visible_tags = ["wmf"];
	
	this.loadNodes = function () {
		$.getJSON(self.baseAPI + "/nodes", function(data) { 
			for(var i = 0; i< data.length; i++) {
				self.nodes.push(data[i]);
			}
		})
	}

	this.renderNodeList = function (div, types) {
		
		// if holder is not empty, then we "collapse" it
		if(div.find(".listoption").length) {
			div.empty();
			return;
		}
			
		var html = "";
		html += "<div class='fatbox'>";
		html += "  <div class='inlinetitleblock'>";
		html += "    <div><span class='title inlinetitle'>Choose type</span></div>"
		html += "  </div>"

		// render node types
		for (var i = 0; i < self.nodes.length; i++) {
			
			var node = self.nodes[i]._id;
			if(types.indexOf(node.type) != -1) {
				html += "  <div class='optionlist'>"
				
				// render subtypes
				for (var j = 0; j < self.nodes[i].subtypes.length; j++) {
					var sub = self.nodes[i].subtypes[j];

					html += "    <button class='accordion "+node.type+"'>"
					html += "      <p class='listtitle'>"+sub.sub.subtype+"</p>"
					html += "      <p class='listtext'></p>"
					html += "    </button>"
					html += "    <div class='panel'>"
					
					sub.nodes.sort(sortByTitle);
					
					// render nodes
					for (var k = 0; k < sub.nodes.length; k++) {
						// skip nodes with status "broken"
						if(sub.nodes[k].status == "broken")
							continue;
							
						self.plainNodes.push(sub.nodes[k]);
						var index = self.plainNodes.length -1;
						var s = sub.nodes[k].title.split(":");
						if(s.length === 2) 
							var title = "<span class='bold'>" + s[0] + "</span>:" + s[1];
						else
							var title = sub.nodes[k].title;
						
						html += "<a data-index='" + index + "' class='open-node' href='#'>"
						html += "<div class='listoption " + node.type + " " + sub.nodes[k].status + "'>"
						html += "  <p class='listtitle'>" + title + "</p>"
						html += "  <p class='listtext'>" + sub.nodes[k].description + "</p>"
						html += "</div>"
						html += "</a>"
						
					}
					html += "</div>"
				}
				html += "    </div>"
			}
		}
		html += "    </div>";
		html += "  </div>";
		html += "</div>";
		
		$(div).empty().append(html);
	}

	this.getNodeByIndex = function (index) {
		 return self.plainNodes[parseInt(index)];
	}

	this.openNodeParameters = function (e, collection) {
		var obj = $(e.target);
		var index = "";
		if(obj.data("index") == null)
			index = obj.parents(".open-node").data("index");
		else 
			index = obj.data("index")
			
		var node = self.getNodeByIndex(index);
		//console.log(node);
		
		var html = "";
		html += "<div class='fatbox " + node.type + " " + node.status + "'>"
		html += "  <div class='inlinetitleblock'>"
		html += "    <div><span class='title inlinetitle'>" + node.description + "</span></div>"
		html += "  </div>"

		// we need to create form for file import (upload)
		if(node.type == "source") {
			if(node.subtype == "file") {
				html += "<form id=\"uploadfile\" action=\"\" method=\"post\" enctype=\"multipart/form-data\">";     
				html += node.views.params;
				html += "</form>";      
			} else {
				html += node.views.params;
			}
		} else {
			html += node.views.params;
		}
		
		html += "    <a href='#'>"
		html += "   <div data-index='" + index + "'  class='button create-node'>Create node</div>"
		html += "  </a> </div>"
		html += "</div>"
		
		var params = $(html);
		if( $(obj.parents(".holder.params")).length != 0)
			$(obj.parents(".holder.params").empty()).append(params);
		else
			$(".holder.collection-params").empty().append(params);


        // fetch fields
        $.getJSON(self.baseAPI + "/collections/" + collection + "/fields", function(data) { 
            if(data.error)
                alert(data.error);
            var options = [];
            for(var i = 0; i < data.sorted.length; i++) {
                options.push("<option>" + data.sorted[i] + "</option>");
            }
            
            // populate field selects
            $(".params select.dynamic_field").each(function(i) {
                $(this).append(options.join(""));
            //    $(this).replaceWith("<select id='" + $(this).attr("id") + "' name='" + $(this).attr("name") + "' class='dynamic_field'><option value=''>choose field</option>"+options.join("")+"</select>");
            })	
        })
		// TODO: get node from /get/node/nodeid so that scripts are included    
		// execute params.js if exists
		//if(node.scripts.params) {
			//var paramsScript = new Function('node', node.scripts.params);
			//paramsScript(node);
		//}
	}


}


function cap(string) {
	return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

function sortByTitle (a,b) {
  if (a.title.toLowerCase() < b.title.toLowerCase())
	return -1;
  if (a.title.toLowerCase() > b.title.toLowerCase())
	return 1;
  return 0; 
}
