
var nodeRepository = function () {
	var self = this;
	this.nodes = []
    this.plainNodes = []
	
	this.loadNodes = function () {
		$.getJSON("/get/nodes", function(data) { 
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
        html += "    <div><span class='title inlinetitle'>Choose node type</span></div>"
        html += "  </div>"
        

        // render node types
        for (var i = 0; i < self.nodes.length; i++) {
            
            var node = self.nodes[i]._id;
            if(types.indexOf(node.type) != -1) {
                html += "  <div class='optionlist'>"
                html += "    <button class='accordion "+node.type+"'>"
                html += "      <p class='listtitle'>"+node.type+"</p>"
                html += "      <p class='listtext'></p>"
                html += "    </button>"
                html += "    <div class='panel'>"
                
                // render subtypes
                for (var j = 0; j < self.nodes[i].subtypes.length; j++) {
                    var sub = self.nodes[i].subtypes[j];
                    
                    html += "<button class='accordion sub "+node.type+"'>" + sub.sub.subtype + "</button>"
                    html += "<div class='panel'>"
                    
                    // render nodes
                    for (var k = 0; k < sub.nodes.length; k++) {
                        self.plainNodes.push(sub.nodes[k]);
                        var index = self.plainNodes.length -1;
                        html += "<a data-index='" + index + "' class='open-node' href='#'>"
                        html += "<div class='listoption " + node.type + "'>"
                        html += "  <p class='listtitle'>" + sub.nodes[k].title + "</p>"
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

    this.openNodeParameters = function (e) {
        var obj = $(e.target);
        var index = "";
        if(obj.data("index") == null)
            index = obj.parents(".open-node").data("index");
        else 
            index = obj.data("index")
            
        var node = self.getNodeByIndex(index);
        
        var html = "";
        html += "<div class='fatbox'>"
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
    }


}
