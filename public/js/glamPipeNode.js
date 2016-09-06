
var glamPipeNode = function (node) {
	var self = this;
	this.node = node;
	
	// render node to project view (left column)
	this.renderNode = function () {
		var html = "<div class='box node " + self.node.type + "' data-id='" + self.node._id + "'>"
		html +=   "  <div class='boxleft'>"
		html +=   "    <div class='boxtag'>" + self.node.type + " > " + self.node.subtype + "</div>"
		html +=   "    <div class='title boxtitle'>" + self.node.title+"</div>"
		html +=   "    <div class='boxtext'>" + self.node.description + "</div>"
		html +=   "  </div>"
		html +=   "  <div class='wikiglyph wikiglyph-cross icon boxicon' aria-hidden='true'></div>"
		html +=   "</div>"
		return html;
	}


	this.getSettings = function (node) {
		
        var settings = {};
        // read input from settings (only direct child nodes and not checkboxes)
        $("workspace .settings > input:not([type='checkbox']), .settings > select, .settings table input:not([type='checkbox']), .settings table select").each(function() {
            var nameSplitted = $(this).attr("name").split("[");
            // if input name has form "set[something1]", then we want to gather all of them to array
            if(nameSplitted.length > 1) {
                (settings[nameSplitted[0]] || (settings[nameSplitted[0]] = [])).push($(this).val());
            } else {
                settings[$(this).attr("name")] = $(this).val();
            }
       
        });
        
        // handle checkboxes separately. Checbox is included only if it is checked
        $("workspace .settings > input[type='checkbox'], .settings table input[type='checkbox']").each(function() {
			if($(this).is(':checked'))
				settings[$(this).attr("name")] = $(this).val();
		});
		
		return settings;	
	}
	

	this.open = function () {
		if(self.node.type == "collection")
			$("workspace .settingscontainer").hide();
		else
			$("workspace .settingscontainer").show();
			
	}


	this.runNode = function (node) {
		
		node.settings = self.getSettings(node);
		console.log(node.settings);
		
		$.post("/run/node/" + node._id, node.settings, function(data) {
			console.log(data);
			if(data.error)
				alert(data.error);
		});
	}

}
