
var glamPipeNode = function (node, gp) {
	var self = this;
	this.gp = gp;
	this.debug = true;
	this.source = node;
	this.data = {"keys": [], "docs": [], "visible_keys": []};
	this.settings = {};
	this.maxArrayLenghtDisplay = 5;
	this.initialVisibleKeysLength = 5; // by default how many fields are shown
	
	this.dataDisplayDiv = "data-workspace data data-display";
	this.dataControlsDiv = "data-workspace data data-controls";
	this.baseAPI = gp.baseAPI;
	
	this.display = new dataTable(this); // default data renderer
		
	//if(node.type == "collection")
		//self.source.collection = node._id;


	// execute node 
	this.run = function () {
		
		self.source.settings = self.getSettings(node);
		console.log("RUNNING node with params: ", self.source.settings);
		
		post(self.baseAPI + "/nodes/" + self.source._id + "/start", self.source.settings, function(data) {
			console.log(data);
			if(data.error) {
				$(".settings").removeClass("busy");
				alert(data.error);
			}
		}).fail(function() {
			alert("GLAMpipe server did not respond!")
		});
	}


	this.runSingle = function (doc_id) {
		
		self.source.settings = self.getSettings(node);
		console.log("RUNNING node with settings: ", self.source.settings);
		
		post(self.baseAPI + "/nodes/" + self.source._id + "/run/" + doc_id, self.source.settings, function(data) {
			console.log(data);
			if(data.error) {
				$(".settings").removeClass("busy");
				alert(data.error);
			}
		}).fail(function() {
			alert("GLAMpipe server did not respond!")
		});
	}
	
	this.stop = function () {
		
		post(self.baseAPI + "/nodes/" + self.source._id + "/stop", {} , function(data) {
			console.log(data);
			if(data.error) {
				$(".settings").removeClass("busy");
				alert(data.error);
			}
		}).fail(function() {
			alert("GLAMpipe server did not respond!")
		});
	}

	
	this.runFinished = function () {
		$(".settingscontainer .wikiglyph-caret-up").addClass("wikiglyph-caret-down");
		$(".settingscontainer .wikiglyph-caret-up").removeClass("wikiglyph-caret-up");
		//$(".settings").hide();
		
		var input = self.getInputFields();
		var output = self.getOutputFields();
		
		self.open({input_keys:input, output_keys:output});
	}

	// getter for input/output fields of the node (used as config for data rendering)
	this.getConfig = function () {
		if(self.source.type != "collection" && self.source.type != "source") {
			var input = self.getInputFields();
			var output = self.getOutputFields();
			return {input_keys:input, output_keys:output};
		} else
			return null;
	}
	

	this.getOutputFields = function () {

		var keys = [];
		// inputs can be in params or settings
		for(var key in self.source.params) {
			if(/^out_/.test(key))
				keys.push(self.source.params[key]);
		}
		for(var key in self.source.settings) {
			if(/^out_/.test(key))
				keys.push(self.source.settings[key]);
		}
		return keys;
	}


	this.getInputFields = function () {

		var keys = [];
		// inputs can be in params or settings
		for(var key in self.source.params) {
			if(/^in_/.test(key))
				keys.push(self.source.params[key]);
		}
		for(var key in self.source.settings) {
			if(/^in_/.test(key))
				keys.push(self.source.settings[key]);
		}
		return keys;
	}


	// render data with node spesific settings and display node settings
	this.open = function (config) {
		if(self.source.type == "collection") {
			$("data-workspace .settingscontainer").hide();
			self.display.render();
		} else {
			self.renderSettings();
			self.display.render();
			$("data-workspace .settingscontainer").show();
		}
			
	}
	
	// render node to project view (left column)
	this.renderNode = function () {
		// huttua
		var node_out_keys = [];
		for(var key in self.source.params) {
			if(/^in_/.test(key) && self.source.params[key] && self.source.params[key] !== "")
				node_out_keys.push(self.source.params[key]);
		}
		for(var i = 0; i < node_out_keys.length; i++) {
			
			if(!self.gp.currentCollection.fields.node_keys.includes(node_out_keys[i]))
				sself.orphan = true;
		}
		// huttua ends
		
		//self.gp.pickedCollectionId = null; // reset collection chooser
		var in_field = '';
		if(self.source.params.parent) {
			var html = "<div class='box node " + self.source.type + "' data-id='" + self.source._id + "'>"
			html +=   "  <div class='boxleft'>"
			html += "<div class='metanode'>TASK "+self.source.title+"</div>";
			html += "</div></div>"
			return html;
		}
		
		var subsubtype = "";
		if(self.source.subsubtype)
			subsubtype = " > " + self.source.subsubtype;
		if(self.source.params.in_field)
			in_field = ': ' + self.source.params.in_field;
		var html = "<div class='box node " + self.source.type + "' data-id='" + self.source._id + "'>"
		html +=   "  <div class='boxleft'>"
		html +=   "    <div class='boxtag'>" + self.source.type + " > " + self.source.subtype + subsubtype + "</div>"
		
		if(self.source.params.title && self.source.params.title != "") 
			html +=   "    <div class='title boxtitle'>" + self.source.params.title + "</div>"
		else 
			html +=   "    <div class='title boxtitle'>" + self.source.title + in_field + "</div>"
		
		html +=   "    <div class='boxtext'>" + self.source.description + "</div>"
		html +=   "  </div>"
		html +=   "  <div class='wikiglyph wikiglyph-cross icon boxicon' aria-hidden='true'></div>"
		html +=   "</div>"
		return html;
	}


	// render node settings and execute its settings.js
	this.renderSettings = function () {
		
		
		$("data-workspace .settingstitle").text("Settings for " + self.source.title);
		$("data-workspace .settings").empty();
		$("data-workspace .settings").append("<div class='params box right'><button class='run-node' data-id='" + self.source._id + "'>run</button></div>");
		$("data-workspace .settings").append(self.source.views.settings);
		$("data-workspace .settings .params").append(self.source.params);
		
		if(self.debug) {
			$("data-workspace .settings").append("<div class='debug box right'><table><tr><td>nodeid:</td><td>" + self.source.nodeid + "</td></tr><tr><td>_id:</td><td>" + self.source._id + "</td></tr></table></div>");
		}
		
		// render parameters
		var params_table = "<table><tbody>";
		for(key in self.source.params) {
			params_table += "<tr><td>" + key + ":</td><td> " + self.source.params[key] + "</td></tr>";
		}
		params_table += "</tbody></table>";
		$("data-workspace .settings .params").append(params_table);
		
		if(self.source.scripts.settings) {
			var settingsScript = new Function('node', self.source.scripts.settings);
			settingsScript(self.source);
		}
		
		self.setSettingValues();
		
	}


	this.setSettingValues = function () {
		var data = self.source;
		for(var prop in data.settings) {
			if(typeof data.settings[prop] == "boolean") {
				$("input[name='"+prop+"']").prop("checked", data.settings[prop]);
				$("input[name='"+prop+"']").change();
			} else {
				if(Array.isArray(data.settings[prop])) {
					for(var i = 0; i < data.settings[prop].length; i++) {
						var n = i+1;
						$("input[name='"+prop+"["+n+"]']").val(data.settings[prop][i]);
					}
				} else {
					$("input[name='"+prop+"']").val(data.settings[prop]);
					$("select[name='"+prop+"']").val(data.settings[prop]);
					$("select[name='"+prop+"']").change();
					
					// textarea
					$("textarea[name='"+prop+"']").val(data.settings[prop]);
				}
			}
		}
	}
	




	// create html table for data display
	this.loadAndRenderData = function () {
		
		self.loadCollectionKeys(function() { 
			self.loadCollectionData(function() {
				self.display.render();
			});	
		})		
	}



	this.getSettings = function (node) {
		
		var settings = {};
		// read input from settings (only inputs with class "node-settings")
		$("data-workspace .settings input.node-settings:not([type='checkbox']), .settings  select.node-settings").each(function() {
			var nameSplitted = $(this).attr("name").split("[");
			// if input name has form "set[something1]", then we want to gather all of them to array
			console.log($(this).attr("name") + ":" +  $(this).val());
			if(nameSplitted.length > 1) {
				(settings[nameSplitted[0]] || (settings[nameSplitted[0]] = [])).push($(this).val());
			} else {
				settings[$(this).attr("name")] = $(this).val();
			}
	   
		});
		
		// handle checkboxes separately. Checbox is included only if it is checked
		$("data-workspace .settings input.node-settings[type='checkbox']").each(function() {
			if($(this).is(':checked'))
				settings[$(this).attr("name")] = $(this).is(':checked');
		});

		// handle textareas separately. Checbox is included only if it is checked
		$("data-workspace .settings textarea.node-settings").each(function() {
				settings[$(this).attr("name")] = $(this).val();
		});
		
		return settings;	
	}
	


	this.loadCollectionData = function (params, cb) {
		
		$.getJSON(self.baseAPI + "/collections/" + self.source.collection + "/docs/" + params.skip() + params.sort() + params.fields_func() + "&" + params.search(), function (docs) {
			self.data.docs = docs.data;
			cb();
		});
	}

	this.loadCollectionKeys = function (cb) {
		$.getJSON(self.baseAPI + "/collections/" + self.source.collection + "/fields", function(keys) {
			self.data.keys = keys;
			cb();
		})
	}



	this.nl2br = function (str, is_xhtml) {   
		var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';    
		return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1'+ breakTag +'$2');
	}

}
