
var glamPipeNode = function (node, gp, display) {
	var self = this;
	this.gp = gp;
	this.debug = true;
	this.backend = false;
	if(node.source) this.source = node.source;
	else this.source = node;
	this.orphan = "";
	this.data = {"keys": [], "docs": [], "visible_keys": null};
	this.settings = {};
	this.maxArrayLenghtDisplay = 5;
	this.initialVisibleKeysLength = 5; // by default how many fields are shown

	this.dataDisplayDiv = "data-workspace data data-display";
	this.dataControlsDiv = "data-workspace data data-controls";
	this.baseAPI = gp.baseAPI;

	this.display = display;


	// execute node
	this.run = function () {

		self.source.settings = self.getSettings(node);
		if(self.checkRequiredInput()) {
			return;
		}
		console.log("RUNNING node with settings: ", self.source.settings);
		// TÄHÄN busy
		$("[data-id='"+self.source._id+"']").addClass("busy");
	
		post(self.baseAPI + "/nodes/" + self.source._id + "/start", self.source.settings, function(data) {
			console.log(data);
			if(data.error) {
				$("[data-id='"+self.source._id+"']").removeClass("busy");
				// reset run button
				if(!self.source.params.parent) {
					var input = self.getInputFields();
					var output = self.getOutputFields();

					self.open({input_keys:input, output_keys:output});
				}
				alert(data.error);
			}
		}).fail(function() {
			$("[data-id='"+self.source._id+"']").removeClass("busy");
			alert("GLAMpipe server did not respond!")
		});
	}

	this.runSingle = function (doc_id) {

		self.source.settings = self.getSettings(node);
		if(self.checkRequiredInput()) {
			return;
		}
		console.log("RUNNING node with settings: ", self.source.settings);

		post(self.baseAPI + "/nodes/" + self.source._id + "/run/" + doc_id, self.source.settings, function(data) {
			console.log(data);

		}).fail(function() {
			$("setting").removeClass("busy");
			// reset run button
			if(!self.source.params.parent) {
				var input = self.getInputFields();
				var output = self.getOutputFields();

				self.open({input_keys:input, output_keys:output});
			}
		});
	}

	this.stop = function () {

		post(self.baseAPI + "/nodes/" + self.source._id + "/stop", {} , function(data) {
			console.log(data);
			if(data.error) {
				$("setting").removeClass("busy");
				alert(data.error);
			}
		}).fail(function() {
			alert("GLAMpipe server did not respond!")
		});
	}


	this.runFinished = function () {
		//$("settingscontainer .wikiglyph-caret-up").addClass("wikiglyph-caret-down");
		//$("settingscontainer .wikiglyph-caret-up").removeClass("wikiglyph-caret-up");
		$(".settings").hide();

		// we open node only if it is not a subnode of metanode
		if(!self.source.params.parent) {
			var input = self.getInputFields();
			var output = self.getOutputFields();

			self.open({input_keys:input, output_keys:output});
		}
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



	this.checkRequiredInput = function() {
		var hits = false;
		$("settingscontainer").find(".required").each(function() {
			if($(this).val() == "") {
				hits = true;
			}
		})

		if(hits) {
			alert("Please give all required fields!")
			return true;
		}
		return false;

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
	this.open = function(config) {
		// in nodedev mode we load node's view scripts directly from node directory
		if(gp.config.nodedevmode) { // TODO: remove hardcoding of url
			$.get("http://localhost:3000/api/v2/nodes/" + self.source._id + "/scripts",  function(data) {
				if(data.view)
					self.source.scripts.view = data.view;
				if(data.action_view)
					self.source.scripts.action_view = data.action_view;
				self.openRender();
			})
		} else {
			self.openRender();
		}
	}


	this.openRender = function() {
		$(".node").removeClass("current");
		$(".node[data-id='" + self.source._id + "']").addClass("current");
		if(self.source.type == "collection") {
			$("data-workspace settingscontainer").hide();
			self.display.render(self);
		} else {
			self.renderSettings();
			self.display.render(self);
			$("data-workspace settingscontainer").show();
		}
	}

	// render node to project view (left column)
	this.renderNode = function () {
		// huttua
		self.orphan_fields = [];
		var node_in_keys = [];
		self.orphan = "";
		//console.log(self.source.params)
		for(var key in self.source.params) {
			if(/^in_/.test(key) && self.source.params[key] && self.source.params[key] !== "")
				node_in_keys.push(self.source.params[key]);
		}
/*
		for(var i = 0; i < node_in_keys.length; i++) {

			if(!self.gp.currentCollectionNode.fields.sorted.includes(node_in_keys[i])) {
				self.orphan = "orphan";
				self.orphan_fields.push(node_in_keys[i]);
			}
		}
		* */
		// huttua ends

		//self.gp.pickedCollectionId = null; // reset collection chooser
		var in_field = '';

		var subsubtype = "";
		if(self.source.subsubtype)
			subsubtype = " > " + self.source.subsubtype;
		if(self.source.params.in_field)
			in_field = ': ' + self.source.params.in_field;

		//var html = "<div class='box node' data-id='" + self.source._id + "'>"
		var html = "<div class='box node " + self.orphan + "' data-id='" + self.source._id + "'>"
		html +=   "  <div class='boxleft'>";

		if(self.orphan_fields.length)
			html +=    "<div>MISSING INPUT: " + self.orphan_fields.join(",") + "</div>";

		//html +=   "    <div class='boxtag'>" + self.source.type + " > " + self.source.subtype + subsubtype + "</div>"



		if(self.source.settings && self.source.node_description && self.source.node_description.trim()  != "") {
			html +=   "    <div class='title boxtitle'>" + self.source.node_description + "</div>"
			html +=   "    <div class='description'>" + self.source.title + "</div>"

		} else {
			html +=   "    <div class='title boxtitle'>" + self.source.title + in_field + "</div>"
			html +=   "    <div class='description'>" + self.source.description + "</div>";
		}

		html +=   "  </div>"
		html +=   "  <div class='wikiglyph wikiglyph-cross icon boxicon' aria-hidden='true'></div>"
		html +=   "</div>"
		return html;
	}


	// render node settings and execute its settings.js
	this.renderSettings = function () {

		var run_button_text = "Run for all documents";

		if(self.source.type === "source")
			run_button_text = "Import data";
		if(self.source.type === "export")
			run_button_text = "Export data";

		if(self.orphan) {
			$("settingsblock").empty().append("<div class='bad'><h2>Input field of this node is missing!</h2></div>");
			$("settingsblock").append("<p>You have probably deleted node that created the missing field or fields. You can fix this by creating that node again with same field names.</p>");
			$("settingsblock").append("<div><h3>missing field(s)</h3>" + self.orphan_fields.join(',') + "</div>");
			$("data-workspace submitblock").empty().append("<button class='run-node button error' >missing input field, cant'run!</button>");

		} else {

			$("data-workspace .settingstitle").text("Settings for " + self.source.title);
			$("settingsblock").empty();

			//$("data-workspace settingsblock").append("<textarea>description</textarea>");
			if(self.backend)
				$("data-workspace submitblock").empty().append("<div class='info'>Backend nodes can't be batch run</div>");
			else
				$("data-workspace submitblock").empty().append("<button class='run-node button' data-id='" + self.source._id + "'>"+run_button_text+"</button>");

			$("settingsblock").append(self.source.views.settings);
			$("settingsblock .params").append(self.source.params);
			$(".show-node-params").data("id", self.source._id);
			// populate collection lists (for example settings of "collection lookup" node)
			//$('.dynamic_collection').append(self.gp.collectionList());


			var debug = "<setting><settinginfo><settingtitle>Node description</settingtitle>";
			debug += "<settinginstructions>Here you can write your own description of what this node does.";
			debug += "<p><a class='show-node-params' href='#'>Show node parameters</a><br><a class='edit-node' href=''>Edit this node</a></p>"
			debug += "</settinginstructions></settinginfo>"
			debug += "<settingaction>";
			debug += "<label>description:</label>";
			debug += "<textarea rows='3' name='node-description' class='node-description-value'></textarea>";

			debug += "<a href='#' id='node-description-save' class='ibutton'>Save description</a>";
			debug += "</settingaction>";
			debug += "</setting>";
			$("settingsblock").append(debug);

			// node description
			if(self.source.settings)
				$(".node-description-value").val(self.source.node_description);
			else
				$(".node-description-value").val("");

			var collection = gp.currentCollection;

			// fetch fields
			$.getJSON(self.baseAPI + "/collections/" + collection.name + "/fields", function(data) {
				if(data.error)
					alert(data.error);
				var options = [];
				
				if(data.keys) {
					for(var i = 0; i < data.keys.length; i++) {
						options.push("<option>" + data.keys[i] + "</option>");
					}
				}

				// execute node's settings.js if exists
				if(self.source.scripts.ui_settings) {
					if(!self.source.settings) self.source.settings = {};
					var settingsScript = new Function('node', self.source.scripts.ui_settings);
					settingsScript(self.source);
				}

				// populate field selects
				$("settingsblock select.dynamic-field").each(function(i) {
					$(this).append(options.join(""));
				//    $(this).replaceWith("<select id='" + $(this).attr("id") + "' name='" + $(this).attr("name") + "' class='dynamic-field'><option value=''>choose field</option>"+options.join("")+"</select>");
				})

				self.setSettingValues();
			})
		}
	}

	this.editNode = function() {
		// setup script editor
		$('settingsblock').append('<div>editor</div>');
	}

	this.renderDebug = function() {

		// render parameters
		var params_table = "<table><tbody>";
		for(key in self.source.params) {
			params_table += "<tr><td>" + key + ":</td><td> " + self.source.params[key] + "</td></tr>";
		}
		params_table += "<tr><td>nodeid:</td><td>" + self.source.nodeid + "</td></tr>";
		params_table += "<tr><td>_id:</td><td>" + self.source._id + "</td></tr>";
		params_table += "<tr><td>version</td><td>" + self.source.version + "</td></tr>";
		params_table += "</tbody></table>";
		return "<div class='debug right'>"+params_table+"</div>";

	}

	this.setSettingValues = function () {
		var data = self.source;
		for(var prop in data.settings) {
			// checkboxes
			if(data.settings[prop] == "true" || data.settings[prop] == "false" || typeof data.settings[prop] === "boolean") {
				var checked = data.settings[prop];
				if(typeof data.settings[prop] !== "boolean")
					checked = (data.settings[prop] == 'true');

				$("input[name='"+prop+"']").prop("checked", checked);
				$("input[name='"+prop+"']").change();
			} else {
				if(Array.isArray(data.settings[prop])) {
					for(var i = 0; i < data.settings[prop].length; i++) {
						var n = i+1;
						$("input[name='"+prop+"["+n+"]']").val(data.settings[prop][i]);
					}
				// normal inputs
				} else {
					$("input[name='"+prop+"']").val(data.settings[prop]);
					$("select[name='"+prop+"']").val(data.settings[prop]);
					$("select[name='"+prop+"']").change();

					// textarea
					$("textarea[name='"+prop+"']").val(data.settings[prop]);
				}
			}
		}
		// script node is a special case with its editor
		if(self.source.nodeid == "process_script" && typeof(editor) !== 'undefined' && data.settings['js']) editor.setValue(data.settings['js']);		
	}





	// create html table for data display
	this.loadAndRenderData = function () {

		self.loadCollectionKeys(function() {
			self.loadCollectionData(function() {
				self.display.render();
			});
		})
	}

	this.saveDescription = function(desc) {

		var d = {
			url:self.baseAPI + "/nodes/" + self.source._id + "/settings/description",
			type:"POST",
			data: {
				description:desc
			},
			error:function() {alert("description save failed!")},
			success: function(data) {
				self.source.node_description = desc;
			}
		}
		$.ajax(d);
	}

	this.getSettings = function (node) {

		var settings = {};
		// read input from settings (only inputs with class "node-settings")
		$("settingsblock input.node-settings:not([type='checkbox']), settingsblock  select.node-settings").each(function() {

			if($(this).attr("name")) {
				var nameSplitted = $(this).attr("name").split("[");
				// if input name has form "set[something1]", then we want to gather all of them to array
				//console.log($(this).attr("name") + ":" +  $(this).val());
				if(nameSplitted.length > 1) {
					(settings[nameSplitted[0]] || (settings[nameSplitted[0]] = [])).push($(this).val());
				} else {
					settings[$(this).attr("name")] = $(this).val();
				}
			}

		});

		// handle checkboxes separately.
		$("settingsblock input.node-settings[type='checkbox']").each(function() {
			//if($(this).is(':checked'))
			settings[$(this).attr("name")] = $(this).is(':checked');
		});

		// handle textareas separately.
		$("settingsblock textarea.node-settings").each(function() {
				settings[$(this).attr("name")] = $(this).val();
		});

		// script node requires sepcial handling
		if(self.source.nodeid == "process_script" && editor) settings['js'] = editor.getValue();

		// finally read the node description
		var desc = $(".node-description-value").val();
		if(desc) {
			settings.node_description = desc;
			var id = node._id;
			$(".node[data-id='"+id+"'] div.boxtext" ).text($(".node-description-value").val());
		}
		return settings;
	}



	this.loadCollectionData = function (params, cb) {

		$.getJSON(self.baseAPI + "/collections/" + self.source.collection + "/docs/" + params.skip() + params.sort() + params.fields_func() + "&" + params.search(), function (docs) {
			self.data.docs = docs.data;
			cb();
		});
	}

	this.loadCollectionKeys = function (cb) {
		$.getJSON(self.baseAPI + "/collections/" + self.source.collection + "/fields", function(data) {
			self.data.keys = data.keys;
			cb();
		})
	}



	this.nl2br = function (str, is_xhtml) {
		var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
		return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1'+ breakTag +'$2');
	}

}
