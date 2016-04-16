
	

	

	var nodeList = function () {
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
			sort:"&sort=author"
		};

		this.collection = [];
		this.loadData = function (cb) {
			$.getJSON("/get/collection/" + node.collection + this.params.skip() + this.params.sort, function(data) { 
				self.collection = [];
				for(var i = 0; i< data.length; i++) {
					data[i].vcc = self.params.skip_value + i + 1;
					self.collection.push(data[i]);
				}
				//getCount();
				//self.renderList();
				cb();
			})
		}

		this.renderList = function () {
			$("#items").empty();
			for(var i = 0; i < self.collection.length; i++) {
				$("#items").append("<a class='item'> "+self.collection[i].author +"</a> (" + self.collection[i].count + ")<br>");
			}
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
	




	function getCount(cb) {
		
		$.getJSON("/get/collection/count/" + node.collection , function(data) { 
			cb(data);
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
		
		var nodes = new nodeList();
		nodes.collectionName = path[path.length -1];
		nodes.loadData(nodes);
		
		$("#source").text(node.data_view);
		
		$("#prev").click(function() {
			nodes.prevPage();
		});
		$("#next").click(function() {
			nodes.nextPage();
		});
		
		$("#items").on("click", ".item", function() {
			query($(this).text());
		});
		
		$("#field_select").on("change", function() {
			$("#selected_fields").append("<button>"+this.value+"</button>");
			reloadFieldSelection();
		});
	}

	function query (term) {
		term = term.trim();
		$.getJSON("/get/collection/byfield/" + node.lookup_collection +"/?field="+ node.params.key + "&value=" + term , function(data) { 
			for(var i = 0; i < data.length; i++) {
				for(var j = 0; j < node.params.fields.length; j++) {
					$("#result").append("<div>"+data[i][node.params.fields[j]]+"</div>");
				}
			}
		})
	}

	function reloadFieldSelection () {
		var fields = [];
		$("#selected_fields button").each(function(index) {
			fields.push($(this).text());
			
		});
		var fields_str = fields.join(",");
		if(fields_str == "")
			window.location.search = "";
		else
			window.location.search = "?fields=" + fields_str;
	}

	function getURLParameter(name) {
	  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null
	}


