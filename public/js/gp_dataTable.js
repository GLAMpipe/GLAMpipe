
var dataTable = function (gp) {
	var self = this;
    this.gp = gp;
	this.data = {"keys": [], "docs": [], "visible_keys": []};
	this.settings = {};
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
			if(this.skip_value > self.data.count)
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
	
	if(node.views.default_keys)
		self.data.visible_keys = node.views.default_keys;
		


    this.expandTable = function (yes) {
		if(yes)
			$("data-workspace table.documents tbody td div").css({"max-height":"600px", "overflow-y":"auto"});
		else
			$("data-workspace table.documents tbody td div").css({"max-height":"3em", "overflow-y":"hidden"});
    }

	this.nextTablePage = function () {
		self.params.skip_func(15);
		self.loadCollectionData(function() {
			self.renderTablePage();
			self.renderCollectionCount();
		});			
	}


	this.prevTablePage = function () {
		self.params.skip_func(-15);
		self.loadCollectionData(function() {
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
		
		self.loadCollectionData(function() {
			self.renderTablePage();
			self.renderCollectionCount();
		});	
	}

	this.renderTableControls = function () {

		var html = "<div class='boxright'> ";
        html += "    <div id='data-expand' class='wikiglyph wikiglyph-eye-lid icon' aria-hidden='true'></div>";
        html += "    <div id='data-search' class='wikiglyph wikiglyph-magnifying-glass icon' aria-hidden='true'></div>";
		html += "    <div id='data-chooser' class='wikiglyph wikiglyph-stripe-menu icon' aria-hidden='true'></div>";
		html += "    <div id='data-prev' class='wikiglyph wikiglyph-caret-left icon' aria-hidden='true'></div>";
		html += "    <div id='data-switch'>0 / 0</div>";
		html += "    <div id='data-next' class='wikiglyph wikiglyph-caret-right icon' aria-hidden='true'></div>";
	    html += "  </div>";
	    html += "  <div id='field-sel'></div>";
	    $(self.dataControlsDiv).empty().append(html);

	}

	// displays data in table format
	this.renderTablePage = function () {

		if(self.data.visible_keys.length)
			var visible_keys = self.data.visible_keys;
		else
			var visible_keys = self.data.keys.sorted.slice(0,5);

		

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
		
		
		// set dynamic bindings for workspace
		$( "data-workspace" ).unbind();
		
		// removing field from visible fields
		$("data-workspace").on('click','.wikiglyph-cross', function(e) {
			self.removeVisibleFields($(e.target).parent().text());
			e.preventDefault();
		})
		
		// adding field to visible fields
		$("data-workspace").on('change','#field-selector', function(e) {
			self.setVisibleFields(this);
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

		// show cell content
		$("data-workspace").on('click','table tbody td div', function(e) {
			self.showCell(e);
		})

	}
	



	this.renderFieldSelector = function () {

		// options for field selector
		var options = "<option>visible fields</option><option value='*'>all fields (*)</option>";
		for (var i = 0; i < self.data.keys.sorted.length; i++) {
			options += "<option value='" + self.data.keys.sorted[i] + "'>" + self.data.keys.sorted[i] + "</option>";		
		}

		var fieldSelect = $("<select id='field-selector'>" + options + "<select>");
		$("data-workspace data data-controls #field-sel").append(fieldSelect);
		

		
	}
	
	
	this.renderDataTable = function () {

		if(self.data.visible_keys.length)
			var visible_keys = self.data.visible_keys;
		else
			var visible_keys = self.data.keys.sorted.slice(0,5);

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
	


    this.showCell = function(event) {
        var obj = $(event.target);
        var col = obj.parent().parent().children().index(obj.parent());
        var colNameIndex = col + 1;
        var row = obj.parent().parent().parent().children().index(obj.parent().parent());
        var doc = self.data.docs[row];
        
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
		$.getJSON("/get/collection/count/" + self.source.collection , function(data) { 
			self.data.count = parseInt(data.count);
			var skip = self.params.skip_value  + 15;
			if(skip > self.data.count)
				skip = self.data.count;
			$("data-workspace #data-switch").text( self.params.skip_value + " - " + skip + " of " + self.data.count );
		})
	}

    this.nl2br = function (str, is_xhtml) {   
        var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';    
        return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1'+ breakTag +'$2');
    }

}
