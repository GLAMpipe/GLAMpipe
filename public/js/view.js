var nodes = {};
	
	ko.bindingHandlers.inline = {
		init: function(element, valueAccessor) {
			var span = $(element);
			var input = $('<textarea />',{'type': 'text', 'style' : 'display:none'});
			span.after(input);
			
			var html = "";
			var content = valueAccessor();
			if(content.constructor.name == "Array") {
				for(var i = 0; i < content.length; i++) {
					html += "<div class='array'>"+content[i]+"</div>";
				}
			} else
				html = content;
			
			ko.applyBindingsToNode(input.get(0), { value: valueAccessor()});
			ko.applyBindingsToNode(span.get(0), { html: html});
			
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
		this.nodeId = "";
		this.params = {
			skip:function() {return "?skip="+this.skip_value;}, 
			skip_value: 0, 
			skip_func: function (val) {
				this.skip_value = this.skip_value + val;
				if (this.skip_value <= 0)
					this.skip_value = 0;
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

		this.inedit = function (data, event) {
			var obj = $(event.target);
			var input = obj.next();
			input.show();
			obj.hide();
		}

		this.collection = ko.observableArray(); // Initial items
		this.loadData = function () {
            console.log(this.params.sort());
			$.getJSON("/get/collection/" + node.collection + this.params.skip() + this.params.sort() + this.params.fields_func(), function(data) { 
				self.collection([]);
				for(var i = 0; i< data.length; i++) {
					data[i].vcc = self.params.skip_value + i + 1;
					self.collection.push(data[i]);
				}
				getCount();
			})
		}
		
		this.nextPage = function() {
			this.params.skip_func(15);
            this.updateURL(this.createParamsURL());
			this.loadData();
		};

		this.prevPage = function() {
			this.params.skip_func(-15);
            this.updateURL(this.createParamsURL());
			this.loadData();
		};
		
		this.sort = function (data, event) {
			if(this.params.reverse) {
				this.params.sort_value = event.target.id;
				this.params.reverse = 0;
			} else {
				this.params.sort_value = event.target.id;
				this.params.reverse = 1;
			}
				
			this.collection([]);
			this.params.skip_value = 0;
            this.updateURL(this.createParamsURL());
            //window.location.search = "sort=" + event.target.id
			this.loadData();
            
		};
		

        this.createParamsURL = function () {
            var query = "";
            query += this.params.fields ? "?fields=" + this.params.fields + "&": "?"
            query += "sort=" + this.params.sort_value;
            query += "&reverse=" + this.params.reverse;
            query += "&skip=" + this.params.skip_value;
            return query
        };
        
        this.updateURL = function (url) {
            var self = this;
            var stateObj = { foo: "bar" };
            history.pushState(stateObj, "", url);
            if(window.parent.nodes.updateNodeViewURL)
                window.parent.nodes.updateNodeViewURL(self.nodeId, url);
            
            // update tab link 
            $("#tab_link").attr("href", url);
            
        };

        this.parseURL = function () {
			var self = this;
            // get fields from URL and update field list in UI
            var fields = getURLParameter("fields");
            if (fields != null) {
                self.params.fields = fields;
                fields = fields.split(",");
                for(var i=0; i < fields.length; i++) {
                    $("#selected_fields").append("<button>"+fields[i]+"</button>");
                }
                
            }

            // get skip from URL
            var skip = parseInt(getURLParameter("skip"));
            if (skip <= 0 || isNaN(skip))
                this.params.skip_value = 0;
            else
                this.params.skip_value = skip;
                
            // and sort
            this.params.sort_value = getURLParameter("sort");
            
            // and sort order
            this.params.reverse = 0;
            var r = parseInt(getURLParameter("reverse"));
            if(!isNaN(r) && r == 1) 
                this.params.reverse = 1;
            
            this.updateURL(this.createParamsURL());
            
        }

        this.updateFields = function () {
            var self = this;
            var fields = [];
            $("#selected_fields button").each(function(index) {
                fields.push($(this).text());
            });
            var fields_str = fields.join(",");
            self.params.fields = fields_str;
            var query = this.createParamsURL();
            //parent.nodes.updateNodeViewURL(self.nodeId, query);
            
            // reload
            window.location.search = query;
        }

        this.toggleAllFields = function () {
            var self = this;
            var fields_str = "*";
            self.params.fields = fields_str;
            var query = this.createParamsURL();
            //parent.nodes.updateNodeViewURL(self.nodeId, query);
            
            // reload
            window.location.search = query;
        }
        
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

        
        this.keyValue = function (data, event) {
            var html = ""; 
            if(data && typeof data === "object") {
                if(data.constructor.name == "Array") {

                    for (var i = 0; i < data.length; i++ ) {
                        html += "<div class='array_array'>"+data[i]+"</div>";
                    }
                    
                } else {
                    html = "<div class='array_object'>\n";
                   
                    for (var j in data) {
                        
                        if (data.hasOwnProperty(j)) {
                            //console.log(j);
                            html += "<div>"+j+": "+data[j]+"</div>\n";
                        }
                    }
                    html += "</div>\n";
                }
                
                return html;
            
            } else {
                return data;
            }
        }

        this.keyValueObj = function (data, key) {
            
            var html = ""; 
            if(typeof data[key] === "object") {

                    html = "<div class='object'>\n";
                    
                    for (var j in data[key]) {
                        
                        if (data[key].hasOwnProperty(j)) {
                            html += "<div class='strong'>"+j+"</div>\n";
                            if(data[key][j].constructor.name != "Array") {
                                html += "<div>"+data[key][j]+"</div>\n";
                            } else {
                                html += "<div class='array'> ARRAY "+data[key][j].length+"</div>\n";
                            }
                        }
                    }
                    html += "</div>\n";
                }
                
            return html;
        }

        

        this.keyValueList = function (data, key) {
            var list = [];
            console.log(data[0].value);

            for (i = 0; i < data.length; i++) {
                for (var j in data[i]) {
                    if (data[i].hasOwnProperty(j)) {
                        list.push({
                            "key": j,
                            "value": data[i][j]
                        });
                    }
                }
            }


            return list;
        };
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

		nodes = new dataList();
		ko.applyBindings(nodes);
		nodes.nodeId = path[path.length -1];
        nodes.parseURL();
		nodes.loadData(nodes);
		
		$("#selected_fields").on("click", "button", function() {
			$(this).remove();
			nodes.updateFields();
		});
		
		$("#field_select").on("change", function() {
			$("#selected_fields").append("<button>"+this.value+"</button>");
            nodes.updateFields();
		});
		
		$("#show_all_fields").on("change", function() {
            nodes.toggleAllFields();
		});
	}



    function writeIframeSrc (fields_str) {
           
        var parent = $(window.parent.document); 
        console.log(node._id);
        var url = "/node/view/"+node._id + fields_str;
        var tab_id = "tab-view-" + node._id;
        parent.find("#iframe_view" ).attr( "src", url);
    }

	function getURLParameter(name) {
	  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null
	}

    window.onpopstate = function(event) {
        $("#selected_fields").empty();
        nodes.parseURL();
        nodes.loadData();
      
    };
