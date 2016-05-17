
	
	ko.bindingHandlers.inline = {
		init: function(element, valueAccessor) {
			var span = $(element);
			var input = $('<input />',{'type': 'text', 'style' : 'display:none'});
			span.after(input);
			
			ko.applyBindingsToNode(input.get(0), { value: valueAccessor()});
			ko.applyBindingsToNode(span.get(0), { text: valueAccessor()});
			
			span.click(function(){
				input.width(span.width());
				span.hide();
				input.show();
				input.focus();
			});
			
			input.blur(function() { 
				span.show();
				input.hide();
			});
			
			input.keypress(function(e){
				if(e.keyCode == 13){
				   span.show();
				   input.hide();
				   var id = span.data("id");
				   var field = span.data("field");
				   var data = {doc_id:id, field:field, value:input.val()};
				   $.post( "/edit/collection/" + node.collection, data, function( data ) {
					  span.text(input.val());
					});
			   }; 
			});
		}
	};
	

	var dataList = function () {
		var self = this;
		this.reverse = false;
		this.collectionName = "";
		this.params = {
			skip:function() {return "?skip="+this.skip_value;}, 
			skip_value: 0, 
			skip_func: function (val) {
				this.skip_value = this.skip_value + val;
				if (this.skip_value <= 0)
					this.skip_value = 0;
				},
			sort:""
		};

		this.inedit = function (data, event) {
			var obj = $(event.target);
			var input = obj.next();
			input.show();
			obj.hide();
		}

		this.collection = ko.observableArray(); // Initial items
		this.loadData = function () {
			$.getJSON("/get/collection/" + node.collection + this.params.skip() + this.params.sort, function(data) { 
				self.collection([]);
				for(var i = 0; i< data.length; i++) {
					data[i].vcc = self.params.skip_value + i + 1;
					self.collection.push(data[i]);
				}
				getCount();
			})
		}
		
		this.nextPage = function() {
			this.params.skip_func(25);
			this.loadData();
		};

		this.prevPage = function() {
			this.params.skip_func(-25);
			this.loadData();
		};
		
		this.sort = function (data, event) {
			if(this.reverse) {
				this.params.sort = '&reverse=1&sort=' + event.target.id;
				this.reverse = false;
			} else {
				this.params.sort = '&sort=' + event.target.id;
				this.reverse = true;
			}
				
			this.collection([]);
			this.params.skip_value = 0;
			this.loadData();
		};
		
		// show deep data
		this.openCell = function (data, event) {
			console.log(data);
			event.preventDefault();
			var obj = $(event.target);
			var details = obj.parent().find(".details");
			var table = $("<div></div>");
			createTable(data, table);
			details.empty();
			details.append(table);

		}
	};
	


	function createTable (data, table) {
		
		
		if(data instanceof Array) {
			if(typeof data[i] === "object") {
				
			}
			for(var i = 0; i < data.length; i++) {
				if(typeof data[i] === "object" || data[i] instanceof Array) {
					var row = $("<div><h3>"+i+"</h3></div>");
					table.append(row);
					createTable(data[i], row);
				} else {
					table.append("<div><span class=\"key\">"+i+": </span><span>"+data[i]+"</span></div>");
				}
			}
		} else {
			for (key in data) {
				if(typeof data[key] === "object" || data[key] instanceof Array) {
					var row = $("<div><h3>"+key+"</h3></div>");
					table.append(row);
					createTable(data[key], row);
				} else {
					table.append("<div><span class=\"key\">"+key+": </span><span>"+data[key]+"</span></div>");
				}
			}
		} 
		
	}

	function getCount() {
		$.getJSON("/get/collection/count/" + node.collection , function(data) { 
			$("#count").text("("+data+" docs)");
		})
	}

	function onLoad() {

		var path = location.pathname.split("/");
		var fields = getURLParameter("fields");
		if (fields != null) {
			fields = fields.split(",");
			for(var i=0; i < fields.length; i++) {
				$("#selected_fields").append("<button>"+fields[i]+"</button>");
			}
		}
		
		var nodes = new dataList();
		nodes.collectionName = path[path.length -1];
		ko.applyBindings(nodes);
		nodes.loadData(nodes);
		
		$("#source").text(node.data_view);
		
		$("#show_source").click(function() {
			$("#source").toggle();
		});
		
		$("#selected_fields").on("click", "button", function() {
			$(this).remove();
			reloadFieldSelection();
		});
		
		$("#field_select").on("change", function() {
			$("#selected_fields").append("<button>"+this.value+"</button>");
			reloadFieldSelection();
		});
	}

	function reloadFieldSelection () {
		var fields = [];
		$("#selected_fields button").each(function(index) {
			fields.push($(this).text());
		});
		var fields_str = fields.join(",");
        if(fields_str != "")
            fields_str = "?fields=" + fields_str;

        // if we are inside iframe, we must update iframe src so that reload keeps selected fields 
        writeIframeSrc(fields_str);
        
        window.location.search = fields_str;
 

        
	}


    function writeIframeSrc (fields_str) {
           
        var parent = $(window.parent.document); 
        console.log(node._id);
        var url = "/node/view/"+node._id + fields_str;
        var tab_id = "tab-view-" + node._id;
        parent.find("#" + tab_id + " div.tabIframeWrapper iframe.iframetab" ).attr( "src", url);
    }

	function getURLParameter(name) {
	  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null
	}

