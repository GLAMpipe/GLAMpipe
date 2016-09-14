
var dataTable = function (node) {
	var self = this;
	this.node = node;
	this.keys = {"all_keys": [], "visible_keys": []};
	this.docCount = 0;
	
	this.hiddenKeys = ["__mp_source", "_id"];
	this.maxArrayLenghtDisplay = 5;
	this.initialVisibleKeysLength = 5; // by default how many fields are shown
	
	this.dataDisplayDiv = "data-workspace data data-display";
	this.dataControlsDiv = "data-workspace data data-controls";

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
	
		self.node.loadCollectionKeys(function() { 
			self.keys.all_keys = self.node.data.keys;
			self.renderControls();
		});
		
		self.node.loadCollectionData(self.params, function() {
			self.renderTablePage();
			self.renderCollectionCount();
		});	
	}


	this.toggleVisibleFields = function (event) {
		var obj = $(event.target);
		obj.toggleClass("good");
		var key = obj.data("name");
		if(obj.hasClass("good"))
			self.keys.visible_keys.push(key);
		else 
			self.keys.visible_keys.splice(self.keys.visible_keys.indexOf(key), 1);
			
	}
	


    this.expandTable = function (yes) {
		if(yes)
			$("data-workspace table.documents tbody td div").css({"max-height":"600px", "overflow-y":"auto"});
		else
			$("data-workspace table.documents tbody td div").css({"max-height":"3em", "overflow-y":"hidden"});
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

		var html = "<div class='boxright'> ";
        html += "    <div id='data-expand' class='wikiglyph wikiglyph-eye-lid icon' aria-hidden='true'></div>";
        html += "    <div id='data-search' class='wikiglyph wikiglyph-magnifying-glass icon' aria-hidden='true'></div>";
		html += "    <div id='data-chooser' class='wikiglyph wikiglyph-stripe-menu icon' aria-hidden='true'></div>";
		html += "    <div id='data-prev' class='wikiglyph wikiglyph-caret-left icon' aria-hidden='true'></div>";
		html += "    <div id='data-switch'>0 / 0</div>";
		html += "    <div id='data-next' class='wikiglyph wikiglyph-caret-right icon' aria-hidden='true'></div>";
	    html += "  </div>";
	    html += "  <div id='field-selector'></div>";
	    $(self.dataControlsDiv).empty().append(html);

	}



	this.getVisibleFields = function () {


		
		if(self.keys.visible_keys.length)
			return self.keys.visible_keys;
		else {
			// if there are no visible keys, then try default keys
			if(self.node.source.views.default_keys) {
				return self.node.source.views.default_keys;		
			// if there are no default keys, then visible keys are first 5 keys 
			} else {
				var keys = self.keys.all_keys.sorted.slice(0,5);
				var c = self.keys.all_keys.sorted.filter(function(item) {
					return self.hiddenKeys.indexOf(item) === -1;
				});
				return c.slice(0,5);
			}
		}
	} 



	// displays data in table format
	this.renderTablePage = function () {

		var visible_keys = self.getVisibleFields();
		var html = "<table id='data' class='documents'><thead><tr>";
		
		// RENDER KEYS
		for (var i = 0; i < visible_keys.length; i++) {
			html += "<td><div>" +  visible_keys[i] + " <span class='wikiglyph wikiglyph-cross icon boxicon'></span></div></td>";
		}
		
		html += "</tr></thead><tbody>"
		
		html += self.renderDataTable();
		
		html += "</tbody></table>" ;

		$(self.dataDisplayDiv).empty();
		$(self.dataDisplayDiv).append("<div id='count'></div>");
		$(self.dataDisplayDiv).append(html);
		
		self.setEventListeners();

	}
	
	

	this.renderDataTable = function () {

		var visible_keys = self.getVisibleFields();
		var html = "";
		
		for(var j = 0; j < self.node.data.docs.length; j++) {
			html += "<tr>";
			for(var k = 0; k < visible_keys.length; k++) {
				
				if(self.node.data.docs[j][visible_keys[k]]) {
					html += "<td>" + self.renderCell(self.node.data.docs[j][visible_keys[k]]) + "</td>";
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

	

    this.showCell = function(event) {
        var obj = $(event.target);
        var col = obj.parent().parent().children().index(obj.parent());
        var colNameIndex = col + 1;
        var row = obj.parent().parent().parent().children().index(obj.parent().parent());
        var doc = self.node.data.docs[row];
        
        var table = obj.parents("table");
        var key = table.find("thead tr td:nth-child(" + colNameIndex + ")").text().trim();
        var cellValue = self.nl2br(doc[key]);
        
        console.log('Row: ' + row + ', Column: ' + col + ',key:' + key);
        $("#cell-display").empty().append(cellValue);
        $("#cell-display").dialog({
            position: { 
                my: 'left top',
                at: 'right top',
                of: obj
            },
            title: "cell data"
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

	this.showAllKeys = function (event) {
		var visible_keys = self.getVisibleFields();
		var obj = $(event.target);
		var html = "<div class='flex visible-keys'>";
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
            position: { 
                my: 'left top',
                at: 'right top',
                of: obj
            },
            title: "Select fields you want to see."
        });
	}

	this.setEventListeners = function () {
		// unset dynamic bindings for workspace
		$( "data-workspace" ).unbind();
		
		
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
			self.showAllKeys(e);
		})	

		// adding field to visible fields
		$("#field-selector").on('click','.flex.visible-keys div', function(e) {
			self.toggleVisibleFields(e);
		})

		// next page of data
		$("data-workspace").on('click','.wikiglyph-caret-right', function(e) {
			self.nextTablePage();
		})

		// previous page of data
		$("data-workspace").on('click','.wikiglyph-caret-left', function(e) {
			self.prevTablePage();
		})

		// expand table view
		$("data-workspace").on('click','.wikiglyph-eye', function(e) {
			self.expandTable(false);
			$(e.target).removeClass("wikiglyph-eye");
			$(e.target).addClass("wikiglyph-eye-lid");
		})

		// expand table view
		$("data-workspace").on('click','.wikiglyph-eye-lid', function(e) {
			self.expandTable(true);
			$(e.target).removeClass("wikiglyph-eye-lid");
			$(e.target).addClass("wikiglyph-eye");
		})

		// previous page of data
		$("data-workspace").on('click','table thead td', function(e) {
			self.sortTableColumn($(e.target).text());
		})



		// ****************************** DATA display *************************

		// show cell content
		$("data-workspace").on('click','table tbody td div', function(e) {
			self.showCell(e);
		})
		
	
		
	}



    this.nl2br = function (str, is_xhtml) {   
        var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';    
        return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1'+ breakTag +'$2');
    }

}
