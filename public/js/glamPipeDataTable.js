
var dataTable = function (node) {
	var self = this;
	this.node = node;
	this.keys = {"all_keys": [], "visible_keys": null};
	this.docCount = 0;
	
	this.hiddenKeys = ["__mp_source", "_id"];
	this.maxArrayLenghtDisplay = 2;
	this.initialVisibleKeysLength = 5; // by default how many fields are shown
	this.maxInputLength = 30; // limit whether input rendered as input or textarea on cell edit
	
	this.dataDisplayDiv 	= "data-workspace data data-display";
	this.dataControlsDiv 	= "data-workspace data data-controls";
	this.keySelectorDiv 	= "#field-selector";

	this.editMode = false;
	this.expandCells = false;

	this.params = {
		skip:function() {return "?skip="+this.skip_value;}, 
		skip_value: 0, 
		skip_func: function (val) {
			this.skip_value = this.skip_value + val;
			if (this.skip_value <= 0)
				this.skip_value = 0;
			if(this.skip_value > self.docCount)
				this.skip_value = this.skip_value - val;
			},
		sort:function() {
			var r = 0;
			if(self.params.reverse)
				r = 1;
			
			if(this.sort_value != "")
				return "&reverse="+r+"&sort="+this.sort_value;
			else
				return "";},
		sort_value: "",
		fields: "",
		fields_func: function () {
			if(this.fields != "")
				return "&fields=" + this.fields;
			else
				return "";
		},
		reverse: 0
	};
	

	// asks data from node and then renders table
	this.render = function () {
	
		if(self.node.getConfig()) {
			self.node.loadCollectionData(self.params, function() {
				self.renderTablePage();
				self.renderControls();
				self.renderCollectionCount();
				self.setEventListeners();
			});		
		} else {
			self.node.loadCollectionKeys(function() { 
				self.keys.all_keys = self.node.data.keys;
				
				self.node.loadCollectionData(self.params, function() {
					self.renderTablePage();
					self.renderControls();
					self.renderCollectionCount();
					self.setEventListeners();
				});	
			});
		}
	}



	this.expandTable = function (yes) {
		if(yes)
			$("data-workspace table.documents tbody td div").css({"max-height":"600px", "overflow-y":"auto"});
		else
			$("data-workspace table.documents tbody td div").css({"max-height":"3em", "overflow-y":"hidden"});
	}


	this.expandCell = function (event) {
		$(event.target).parent().css({"max-height":"600px", "overflow-y":"auto"});
	}


	this.nextTablePage = function () {
		self.params.skip_func(15);
		self.node.loadCollectionData(self.params, function() {
			self.renderTablePage();
			self.renderCollectionCount();
		});			
	}



	this.prevTablePage = function () {
		self.params.skip_func(-15);
		self.node.loadCollectionData(self.params, function() {
			self.renderTablePage();
			self.renderCollectionCount();
		});			
	}



	this.sortTableColumn = function (field) {
		
		if(this.params.sort_value == field.trim()) {
			if(this.params.reverse) {
				this.params.reverse = 0;
			} else {
				this.params.reverse = 1;
			}
		} else {
			this.params.sort_value = field.trim();
			this.params.reverse = 0;
		}
		
		this.params.skip_value = 0;
		
		self.node.loadCollectionData(self.params, function() {
			self.renderTablePage();
			self.renderCollectionCount();
		});	
	}



	this.renderControls = function () {
		var html = "<div class='boxright' style='float:right'> ";
		html += "    <div id='data-expand' class='wikiglyph wikiglyph-edit icon' aria-hidden='true' title='edit'></div>";
		html += "    <div id='data-expand' class='wikiglyph wikiglyph-eye-lid icon' aria-hidden='true' title='expand cells'></div>";
		html += "    <div id='data-search' class='wikiglyph wikiglyph-magnifying-glass icon' aria-hidden='true' title='search (not implemented)'></div>";
		html += "    <div id='data-chooser' class='wikiglyph wikiglyph-stripe-menu icon' aria-hidden='true' title='visible fields'></div>";
		html += "  </div>";
		html += "  <div class='boxright'> ";
		html += "    <div id='data-prev' class='wikiglyph wikiglyph-caret-left icon' aria-hidden='true'></div>";
		html += "    <div id='data-switch'>0 / 0</div>";
		html += "    <div id='data-next' class='wikiglyph wikiglyph-caret-right icon' aria-hidden='true'></div>";
		html += "  </div>";
		html += "  <div id='field-selector'></div>"; // field selector dialog
		$(self.dataControlsDiv).empty().append(html);

	}


	this.getVisibleFields = function (config) {

		// if node has input/output field, then use them as visible fields
		if(config) {
			console.log("has config");
			var keys = config.input_keys;
			return keys.concat(config.output_keys);
		}

		// otherwise let the user decide what to see
		if(self.keys.visible_keys == null) {
			// if there are no visible keys, then try default keys
			if(self.node.source.views.default_keys) {
				self.keys.visible_keys = self.node.source.views.default_keys;		
			// if there are no default keys, then visible keys are first 5 keys 
			} else {
				var keys = self.keys.all_keys.sorted.slice(0,5);
				var c = self.keys.all_keys.sorted.filter(function(item) {
					return self.hiddenKeys.indexOf(item) === -1;
				});
				self.keys.visible_keys = c.slice(0, self.initialVisibleKeysLength);
			}
		}
		if(self.keys.visible_keys.indexOf("row") === -1) {
			self.keys.visible_keys.splice(0, 0, "row");
			return self.keys.visible_keys;
		} else
			return self.keys.visible_keys;
			
	} 



	// displays data in table format
	this.renderTablePage = function () {

		var config = self.node.getConfig();
		var visible_keys = self.getVisibleFields(config);
		var html = "<table id='data' class='documents'><thead><tr>";
		
		// RENDER KEYS
		for (var i = 0; i < visible_keys.length; i++) {
			html += "<td><div>" +  visible_keys[i] + "</div></td>";
		}
		
		html += "</tr></thead><tbody>"
		
		html += self.renderDataTable();
		
		html += "</tbody></table>" ;

		$(self.dataDisplayDiv).empty();
		$(self.dataDisplayDiv).append("<div id='count'></div>");
		$(self.dataDisplayDiv).append(html);
		
		// make edit buttons visible id edit mode is on
		if(self.editMode)
			$("data-workspace table tbody td div.edit").css('display','inline');
		

	}
	
	this.getRowIndex = function (index) {
		return self.params.skip_value + index + 1;
	}

	this.renderDataTable = function () {

		if(self.node.data.docs.length == 0)
			return "<h2>This collection is empty</h2><p>Add source node to get something to look at :)</p>";

		var config = self.node.getConfig();
		var visible_keys = self.getVisibleFields(config);
		console.log(visible_keys)

		// we render output fields with class "output"

		var html = "";
		
		for(var j = 0; j < self.node.data.docs.length; j++) {
			//console.log(self.node.data.docs[j]);
			html += "<tr>";
			for(var k = 0; k < visible_keys.length; k++) {
				if(visible_keys[k] == "row") // "row" is not an actual key, just an internal row counter
					html += "<td>" + self.getRowIndex(j) + "</td>";
				else {
					if(config) { 
						if(config.output_keys.indexOf(visible_keys[k]) !== -1) {
							html += "<td><div class='edit wikiglyph-edit'></div>" + self.renderCell(self.node.data.docs[j][visible_keys[k]], null, "output") + "</td>";
						} else {
							html += "<td><div class='edit wikiglyph-edit'></div>" + self.renderCell(self.node.data.docs[j][visible_keys[k]], null, "") + "</td>";
						}
					} else {
						html += "<td><div class='edit wikiglyph-edit'></div>" + self.renderCell(self.node.data.docs[j][visible_keys[k]], null, "") + "</td>";
					}
				}
			}
			html += "</tr>";
			
		}
		return html;
	}



	this.renderCell = function (data, index, className) {
		
		var html = "";
		
		// render arrays recursively
		if (Array.isArray(data)) {
			for(var i = 0; i < data.length; i++) {
				html += self.renderCell(data[i], i, className);
				
				if(!self.expandCells && i > self.maxArrayLenghtDisplay) {
					var left = data.length - i -1;
					html += "<div class='more'>" + left + " more ...</div>"
					break;
				}
					
			}
		// render string, numbers and nulls
		} else if (typeof data == "string" || typeof data == "number" || data === null) {
			if(index != null)
				html += "<div class='"+className+"'>["+index+"] " + data + "</div>";
			else
				html += "<div class='"+className+"'>" + data + "</div>";
		// render objects
		} else {
			if(index != null)
				html += "<div data-index="+index+" class='object-cell'>["+index+"] object</div>";
			else
				html += "<div class='object-cell'>object</div>";
		}
		return html;
	}

	
	this.getDocByTableClick = function (event) {
		var obj = $(event.target);
		var row = obj.parent().parent().parent().children().index(obj.parent().parent());
		return self.node.data.docs[row]; // row gives document from *current* data set		
	}

	this.getKeyByTableClick = function (event) {
		var obj = $(event.target);
		var col = obj.parent().parent().children().index(obj.parent());
		var colNameIndex = col + 1;
		var table = obj.parents("table");
		return table.find("thead tr td:nth-child(" + colNameIndex + ")").text().trim();
	}

	this.renderObject = function (event) {

		var obj = $(event.target);
		var index = obj.data("index");
		
		var doc = self.getDocByTableClick(event);
		var key = self.getKeyByTableClick(event);
		var value = doc[key];
		if(value && Array.isArray(value) && index !== null)
			value = value[index];
		
		var html = self.object2Html(value);
		$("#cell-display").empty().append(html);
		$("#cell-display").dialog({
			position: { 
				my: 'left top',
				at: 'right top',
				of: obj
			},
			width:400,
			maxHeight: 400,
			title: "cell data"
		});

	}

	this.object2Html = function (value, key) {
		var html = "";

		// arrays
		if(Array.isArray(value)) {
			if(key)
				html += "<li><span class='bold'>" + key + "</span>:<ul>";
			else
				html += "<li><ul>";
			for(var i=0; i < value.length; i++) {
				html += "<li>[" + i + "]";
				html += self.object2Html(value[i], key);
				html += "</li>";
			}
			html += "</ul></li>"
		
		// primitive values	
		} else if(value === null || typeof value === "string" || typeof value === "number") {
			if(key)
				html += "<li><span class='bold'>" + key + "</span>: " + value + "</li>";
			else
				html += "<li>" + value + "</li>";
				
		//objects
		} else if(typeof value === "object") {
			html += "<ul>";
			for(key in value) {
				html += self.object2Html(value[key], key);
			}
			html += "</ul>";	
		}


		return html;
	}

	this.openSearchDialog = function () {

		html = "<select name='search_key'>";
		for(var i = 0; i < self.node.data.keys.sorted.length; i++) {
			html += "<option>" + self.node.data.keys.sorted[i] + "</option>";
		}
		html += "</select>";
		html += " includes <input id='data-search-field' name='search_term'/>";
		
		html += "<div>You can use regular expressions.</div>";
		html += "<button>search</button>";
		
		
		var obj = $("#data-search");
		$("#cell-display").empty().append(html);
		$("#cell-display").dialog({
			position: { 
				my: 'left top',
				at: 'right top',
				of: obj
			},
			width:400,
			maxHeight: 400,
			title: "search"
		});
		
	}

	this.editCell = function(event) {
		
		var obj = $(event.target);
		var doc = self.getDocByTableClick(event);
		var key = self.getKeyByTableClick(event);
		var value = doc[key];
		
		var html = "";
		if(Array.isArray(value)) {
			for(var i = 0; i < value.length; i++) {
				html += self.renderTextInput(key+"[]", value[i]);
			}
		} else {
			html += self.renderTextInput(key, value);
		}
		
		html += "<button data-doc_id='"+doc._id+"' class='save'>save</button>";
		
		//console.log('Editing row: ' + row + ', column: ' + col + ',key:' + key);
		$("#cell-display").empty().append(html);
		$("#cell-display").dialog({
			position: { 
				my: 'left top',
				at: 'right top',
				of: obj
			},
			title: "cell data"
		});
	}



	this.renderTextInput = function (key, value) {
		var html = "";
		if(value.length > self.maxInputLength) {
			html = "<textarea name='"+  key +"'>"+self.nl2br(value)+"</textarea>";
		} else {
			html += "<input name='"+ key +"'value='"+ value +"'></input>";
		}
		return html;
	}



	this.saveCellEdit = function (event) {
		var doc_id = $(event.target).data("doc_id");
		console.log("start listing values");
		var data = {field:""};
		
		// get field name
		var name = $("#cell-display input, #cell-display textarea").first().attr("name");
		// if input name has form "set[something1]", then we want to gather all of them to array
		var nameSplitted = name.split("[");
		if(nameSplitted.length > 1) 
				data.value = [];
		
		$("#cell-display input, #cell-display textarea").each(function(i) {
            
            // if input name has form "set[something1]", then we want to gather all of them to array
            if(nameSplitted.length > 1) {
                data.value.push($(this).val());
            } else {
                data.value = $(this).val();
            }
		})
		data.field = nameSplitted[0];
		data.doc_id = doc_id;
		console.log(data);
		if(data.field == "_id")
			alert("Can not edit the internal ID of the document!")
		else
			self.node.gp.updateDocument(data, function () {
				$("#cell-display").dialog("close");
				self.render();
			});
		
	}



	this.renderCollectionCount = function () {
		$.getJSON("/get/collection/count/" + self.node.source.collection , function(data) { 
			self.docCount = parseInt(data.count);
			var skip = self.params.skip_value  + 15;
			if(skip > self.docCount)
				skip = self.docCount;
			$("data-workspace #data-switch").text( self.params.skip_value + " - " + skip + " of " + self.docCount );
		})
	}

	this.showVisibleKeysSelector = function (event) {
		var visible_keys = self.getVisibleFields();
		var obj = $(event.target);
		var html = "<button class='toggle_all'>invert selection</button><button class='unselect_all'>unselect all</button>";
		html += "<hr/><div class='flex visible-keys'>";
		for(var i = 0; i < self.keys.all_keys.sorted.length; i++) {
			if(visible_keys.indexOf(self.keys.all_keys.sorted[i]) === -1)
				html += "<div data-name='"+self.keys.all_keys.sorted[i]+"'>" + self.keys.all_keys.sorted[i]  + "</div>";
			else
				html += "<div class='good' data-name='"+self.keys.all_keys.sorted[i]+"'>" + self.keys.all_keys.sorted[i]  + "</div>";
				
		}
		html += "</div>";
		
		$("#field-selector").empty().append(html);
		$("#field-selector").dialog({
			height:"500",
			width: "900",
			close:self.render,
			position: { 
				my: 'left top',
				at: 'right top',
				of: obj
			},
			title: "Select fields you want to see."
		});
	}


	// add or remove field and re-render table
	this.toggleVisibleField = function (event) {
		var obj = $(event.target);
		obj.toggleClass("good");
		var key = obj.data("name");
		
		if(obj.hasClass("good"))
			self.keys.visible_keys.push(key);
		else 
			self.keys.visible_keys.splice(self.keys.visible_keys.indexOf(key), 1);
	}
	
	this.collectVisibleFiels = function () {
		self.keys.visible_keys = [];
		$(".visible-keys").children().filter("div.good").each(function(index) {
			self.keys.visible_keys.push($(this).data("name"));
			//console.log("good:", $(this).data("name"))
		})
	}

	// unselect/select all
	this.toggleVisibleFields = function () {
		$("#field-selector .visible-keys div").toggleClass("good");
		self.collectVisibleFiels();
	}


	// unselect/select all
	this.unselectVisibleFields = function () {
		$("#field-selector .visible-keys div").removeClass("good");
		self.collectVisibleFiels();	
	}


	this.setEventListeners = function () {
		// unset dynamic bindings for workspace
		$( "data-workspace" ).unbind();
		$( "#cell-display" ).unbind();
		
		
		// ****************************** CONTROLS *************************
		// removing field from visible fields
		$("data-workspace").on('click','.wikiglyph-cross', function(e) {
			self.removeVisibleFields($(e.target).parent().text());
			e.preventDefault();
		})
		
		// adding field to visible fields
		$("data-workspace").on('change','#field-selector', function(e) {
			self.setVisibleFields(this);
		})			

		// open field selector
		$("data-workspace").on('click','.wikiglyph-stripe-menu', function(e) {
			self.showVisibleKeysSelector(e);
		})	

		// adding field to visible fields
		$("#field-selector").on('click','.flex.visible-keys div', function(e) {
			self.toggleVisibleField(e);
		})

		// toggle all visible fields
		$("#field-selector").on('click','.toggle_all', function(e) {
			self.toggleVisibleFields(e);
		})

		// unselect all visible fields
		$("#field-selector").on('click','.unselect_all', function(e) {
			self.unselectVisibleFields(e);
		})

		// next page of data
		$("data-workspace").on('click','.wikiglyph-caret-right', function(e) {
			self.nextTablePage();
		})

		// previous page of data
		$("data-workspace").on('click','.wikiglyph-caret-left', function(e) {
			self.prevTablePage();
		})

		// edit mode
		$("data-workspace").on('click','data-controls .wikiglyph-edit', function(e) {
			$("data-workspace table tbody td div.edit").toggle();
			self.editMode = !self.editMode;
		})

		// shrink all cells
		$("data-workspace").on('click','.wikiglyph-eye', function(e) {
			self.expandTable(false);
			self.expandCells = false;
			self.renderTablePage();
			$(e.target).removeClass("wikiglyph-eye");
			$(e.target).addClass("wikiglyph-eye-lid");
		})

		// expand all cells
		$("data-workspace").on('click','.wikiglyph-eye-lid', function(e) {
			console.log("eye-lid clicked");
			self.expandTable(true);
			self.expandCells = true;
			self.renderTablePage();
			$(e.target).removeClass("wikiglyph-eye-lid");
			$(e.target).addClass("wikiglyph-eye");
		})

		// expand individual cell
		$("data-workspace").on('click','table tbody td div.more', function(e) {
			self.expandCell(e);
		})

		// open search
		$("data-workspace").on('click','.wikiglyph-magnifying-glass', function(e) {
			console.log("search clicked");
			self.openSearchDialog();
		})

		// make search
		$("data-workspace").on('keyup','#data-search-field', function(e) {
			console.log($(this).val());
		})	

		// sort per column
		$("data-workspace").on('click','table thead td', function(e) {
			self.sortTableColumn($(e.target).text());
		})


		// ****************************** DATA display *************************

		// edit cell content
		$("data-workspace").on('click','table tbody td div.edit', function(e) {
			self.editCell(e);
		})
		
		$("#cell-display").on("click", ".save", function(e) {
			self.saveCellEdit(e);
		});
		
		$("data-workspace").on("click", ".object-cell", function(e) {
			self.renderObject(e);
		});
		
	}



	this.nl2br = function (str, is_xhtml) {   
		var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';    
		return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1'+ breakTag +'$2');
	}

}
