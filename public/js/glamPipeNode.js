
var glamPipeNode = function (node) {
	var self = this;
	this.source = node;
	this.data = {"keys": [], "docs": [], "visible_keys": []};
	this.settings = {};
	this.maxArrayLenghtDisplay = 5;
	this.initialVisibleKeysLength = 5; // by default how many fields are shown
	
	if(node.views.default_keys)
		self.data.visible_keys = node.views.default_keys;
		
	if(node.type == "collection")
		self.source.collection = node._id;
	
	// render node to project view (left column)
	this.renderNode = function () {
		var html = "<div class='box node " + self.source.type + "' data-id='" + self.source._id + "'>"
		html +=   "  <div class='boxleft'>"
		html +=   "    <div class='boxtag'>" + self.source.type + " > " + self.source.subtype + "</div>"
		html +=   "    <div class='title boxtitle'>" + self.source.title+"</div>"
		html +=   "    <div class='boxtext'>" + self.source.description + "</div>"
		html +=   "  </div>"
		html +=   "  <div class='wikiglyph wikiglyph-cross icon boxicon' aria-hidden='true'></div>"
		html +=   "</div>"
		return html;
	}


	// render node settings and execute its settings.js
	this.renderSettings = function () {
		
		
		$("workspace .settingstitle").text("Settings for " + self.source.title);
		$("workspace .settings").empty();
		$("workspace .settings").append(self.source.views.settings);
		
		if(self.source.scripts.settings) {
			var settingsScript = new Function('node', self.source.scripts.settings);
			settingsScript(self.source);
		}
		
		$("workspace .settings").append("<div class='box'><button class='run-node' data-id='" + self.source._id + "'>run</button></div>");
	}


	// create html table for data display
	this.loadAndRenderData = function () {
		
		self.loadCollectionKeys(function() { 
			self.loadCollectionData(function() {
				self.renderTablePage();
				self.renderCollectionCount();
			});	
		})

		
	}



	this.renderTablePage = function () {

		if(self.data.visible_keys.length)
			var visible_keys = self.data.visible_keys;
		else
			var visible_keys = self.data.keys.sorted.splice(0,5);

		

		var html = "<table id='data' class='documents'><thead><tr>";
		
		// RENDER KEYS
		for (var i = 0; i < visible_keys.length; i++) {
			html += "<td><div>" +  visible_keys[i] + " <span class='wikiglyph wikiglyph-cross icon boxicon'></span></div></td>";
		}
		
		html += "</tr></thead><tbody>"
		
		html += self.renderDataTable();
		
		html += "</tbody></table>" ;

		$("workspace data").empty();
		$("workspace data").append("<div id='count'></div>");
		
		self.renderFieldSelector();
		
		$("workspace data").append("<div id='selected_fields'></div>");
		$("workspace data").append(html);
		
		
		// set dynamic bindings for workspace
		$( "workspace" ).unbind();
		$("workspace").on('click','.wikiglyph-cross', function(e) {
			self.removeVisibleFields($(e.target).parent().text());
			e.preventDefault();
		})
		
		// visible fields selector
		$("workspace").on('change','#field-selector', function(e) {
			self.setVisibleFields(this);
		})			


	}
	

	this.renderFieldSelector = function () {

		// options for field selector
		var options = "<option>visible fields</option><option value='*'>all fields (*)</option>";
		for (var i = 0; i < self.data.keys.sorted.length; i++) {
			options += "<option value='" + self.data.keys.sorted[i] + "'>" + self.data.keys.sorted[i] + "</option>";		
		}

		var fieldSelect = $("<select id='field-selector'>" + options + "<select>");
		$("workspace data").append(fieldSelect);
		

		
	}
	
	
	this.renderDataTable = function () {

		if(self.data.visible_keys.length)
			var visible_keys = self.data.visible_keys;
		else
			var visible_keys = self.data.keys.sorted.splice(0,5);

		var html = "";

			
		
		for(var j = 0; j < self.data.docs.length; j++) {
			html += "<tr>";
			for(var k = 0; k < visible_keys.length; k++) {
				
				if(self.data.docs[j][visible_keys[k]]) {
					html += "<td>" + self.renderCell(self.data.docs[j][visible_keys[k]]) + "</td>";
				} else {
					html += "<td><div><div></td>";
				}
			}
			html += "</tr>";
			
		}
		return html;
	}



	this.renderCell = function (data, index) {
		
		var html = "";
		if(data) {
			if (Array.isArray(data)) {
				for(var i = 0; i < data.length; i++) {
					html += self.renderCell(data[i], i);
					if(i > self.maxArrayLenghtDisplay) {
						var left = i - self.maxArrayLenghtDisplay;
						html += "<div>" + left + " more ...</div>"
						break;
					}
						
				}
			} else if (typeof data == "string" || typeof data == "number") {
				if(typeof index !== "undefined")
					html += "<div>["+index+"] " + data + "</div>";
				else
					html += "<div>" + data + "</div>";
			} else {
				html += "<div>object</div>";
			}
		} else {
			html += "<div></div>";
		}
		return html;
	}



	this.setVisibleFields = function (opt) {
		if(self.data.visible_keys.indexOf(opt.value) == -1) {
			self.data.visible_keys.push(opt.value);	
			self.loadAndRenderData();
		}
	}
	
	this.removeVisibleFields = function (key) {
		var i = self.data.visible_keys.indexOf(key.trim());
		if(i != -1) {
			self.data.visible_keys.splice(i, 1);
		}	
		console.log(self.data.visible_keys);
		console.log(i);
		self.loadAndRenderData();
		
	}	
	
	// render data with node spesific settings and display node settings
	this.open = function () {
		if(self.source.type == "collection") {
			$("workspace .settingscontainer").hide();
			self.loadAndRenderData();
		} else {
			self.renderSettings();
			self.loadAndRenderData();
			$("workspace .settingscontainer").show();
		}
			
	}


	this.run = function () {
		
		self.settings = self.getSettings(node);
		console.log("RUNNING node with params: ", self.settings);
		
		$.post("/run/node/" + self.source._id, self.settings, function(data) {
			console.log(data);
			if(data.error)
				alert(data.error);
		});
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
	






	this.loadCollectionData = function (cb) {
		
		$.getJSON("/get/collection/" + self.source.collection, function (docs) {
			self.data.docs = docs.data;
			cb();
		});
	}

	this.loadCollectionKeys = function (cb) {
		$.getJSON("/get/collection/" + self.source.collection + "/fields", function(keys) {
			self.data.keys = keys;
			cb();
		})
	}

	this.renderCollectionCount = function () {
		$.getJSON("/get/collection/count/" + self.source.collection , function(data) { 
			$("workspace #count").text("(" + data.count + " docs)");
		})
	}

}
