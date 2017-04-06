function refjyx (config) {
	
	var self 					= this;
	this.config 				= config
	this.collection 			= config.collection;
	this.url 					= config.gp_url;
	this.filters 				= config.filters;
	this.item_table 			= null;
	this.dataRender				= null;

	this.collection_url 		= this.url + "/collections/" + this.collection
	this.get_facet_url 			= this.collection_url + "/facet/";
	this.get_count_url 			= this.collection_url + "/count";
	this.get_filtered_items_url = this.collection_url + "/search";

	if(self.config.item_table)
		this.item_table = self.config.item_table;

	if(self.config.dataRender)
		this.dataRender	= self.config.dataRender;

	this.initFilters = function () {
		// add "selections" and "values" arrays to filters
		self.filters.forEach(function(filter) {
			filter.selections = [];
			// we default for collapsed facet
			if(!filter.collapse)
				filter.collapse = "collapse";
			
			// move checked values to selections
			if(filter.values) {
				filter.values.forEach(function(value) {
					if(value.checked)
						filter.selections.push(value.value);
				})
			}
		})
	}

	this.render = function() {
		if(typeof self.dataRender !== "undefined" && self.dataRender !== null) {
			self.dataRender(self);
			self.renderFilters();
		} else {
			self.renderFilteredSet();
			self.renderFilters();
		}
			
			

	}

	this.renderFilters = function () {
		
		self.filters.forEach(function(filter) {
			
			// render static filters
			if(filter.mode == "static") {
				var html = "<div class='filter-"+filter.op+"' id='"+filter.key+"'>";
				html += "<h3>" + filter.title + "</h3><ul>";
				if(filter.render == "checkbox") {
					filter.values.forEach(function(value) {
						if(value.checked)
							html += "<li><input type='checkbox' checked='checked' value='"+value.value+"'/>"+value.title+"</li>"
						else
							html += "<li><input type='checkbox'  value='"+value.value+"'/>"+value.title+"</li>"
					})
				}
				html += "</ul></div>";
				
				// render static only once
				if($("#" + filter.key).length == 0)
					$(filter.display).append(html);
				
			// render facet filters
			} else if(filter.mode == "facet") {
				self.renderFacet(filter);
			}
			
		})
		
 		
	}

	this.setCheckboxOnOff = function (key, value, checked) {
		self.filters.forEach(function(filter) {
			if(filter.key == key) {
				if(filter.values) {
					filter.values.forEach(function(checkbox) {
						if(checkbox.value == value)
							checkbox.checked = checked;
					})
				}
				
				var index = filter.selections.indexOf(value)
				if(checked) {// add selection
					if( index === -1)
						filter.selections.push(value);
				} else {// remove selection
					if (index !== -1)
						filter.selections.splice(index, 1);
				}
			}
		})
		
		self.render();
		
	}


	this.setFacetOnOff = function (facet) {
		console.log(facet)
		self.filters.forEach(function(filter) {
			if(filter.key == facet.key) {
				
				var index = filter.selections.indexOf(facet.value);
				console.log(index);
				if(index === -1) {
					if(facet.checked)
						filter.selections.push(facet.value);

				} else {
					if(!facet.checked)
						filter.selections.splice(index, 1);					
				}
				console.log(filter.selections);
				
				// make it visible that facet has selections
				if(filter.selections.length)
					$("#" + filter.key + "_holder .panel-heading").addClass("has-selections");
				else
					$("#" + filter.key + "_holder .panel-heading").removeClass("has-selections");
				
			}
		})



		
		self.render();
	}



	this.setFacetCollapse = function (id, collapse) {
		var key = id.replace("#","");
		self.filters.forEach(function(filter) {
			if(filter.key == key) {
				if(collapse)
					filter.collapse = "collapse";
				else
					filter.collapse = "in";
			}
		})
	}


	this.setFacetSort = function (facet) {
		self.filters.forEach(function(filter) {
			if(filter.key == facet.key) {
				filter.sort = facet.value;
				self.renderFacet(filter);
			}
		})
	}

	// 
	this.getFilteredQuery = function (facet_query) {
		var query = [];
		self.filters.forEach(function(filter) {
			filter.selections.forEach(function(sel) {
				query.push(filter.key + "[]=" + encodeURIComponent(sel)); 
			})
			
			// filter specific operator		
			if(filter.op)
				query.push(operator = "op[]=" + filter.key + ":" + filter.op);
		})
		return query.join("&");
	}



	this.renderFilteredSet = function () {

		var filters = "?" + self.getFilteredQuery();
		//console.log(filters)
		var params = "&limit=500";
		if(self.config.item_table.sort) {
			params += "&sort=" + self.config.item_table.sort;
			if(self.config.item_table.reverse) 
				params+= "&reverse=" + self.config.item_table.reverse;
			
		}
		var html = "<table><tr>";
		self.item_table.headers.forEach(function(header) {
			html += "<th>" + header + "</th>";
		})
		html += "</tr>";
		
		if(filters == "?") {
			//html += "</table>";
			//$(target).empty().append(html);	
			//return;		
		}
		
		$.getJSON(this.get_filtered_items_url + filters + params, function (response) {
			response.data.forEach(function(item) {
				self.item_table.rows.forEach(function(row) {
					if(row.render)
						html += "  <td><div class='strong'>" + row.render(item) + "</div></td>";
					else if(row.key)
						html += "  <td><div class='strong'>" + self.joinArray(item[row.key]) + "</div></td>";
					else
						html += "  <td><div class='strong'></div></td>";
				})
				html += "<tr>"
			})
			html += "</table>";
			$(self.item_table.display).empty().append(html);
		})
	}



	this.renderFacet = function (facet) {

		var sort = "";
		var item_count = 0;
		var filters = "?" + self.getFilteredQuery();
		if(filters == "?") {
			//$("#" + facet.key).find("ul").empty();	
			//return;
		}
		
		if(facet.sort)
			sort = "&sort=" + facet.sort;
		
		var params = "&limit=200" + sort;
		$.getJSON(self.get_facet_url + encodeURIComponent(facet.key) + filters + params, function (response) {
			
			var holder = "<div id='"+facet.key + "_holder' class='panel panel-default'>";
			var sort = self.getFacetSortHTML(facet);
			var items = "<div id='" + facet.key + "' class='panel-collapse "+facet.collapse+"'>";
			
			holder += self.getFacetHeadingHTML(facet);
			
			response.count.forEach(function(item) {
				item_count++;
				if(facet.render == "list") {
					items.push($("<li></li>").text(item._id + " (" + item.count + ")"));

				} else {
					items +="<div class='list-group-item checkbox checkbox-circle'>";
					items += self.checkSelection(facet, item, item_count);
                    items += "<label for='"+facet.key + item_count +"'>"+item._id+" <span class='badge'>"+item.count+"</span></label>";
                    items += "</div>"
				}
				
			})
			items += "</div>";
			
			// if facet holder exists, then update only items
			if(document.getElementById(facet.key)) {
				$("#" + facet.key + "_holder").find("#" + facet.key).replaceWith(items);
			// otherwise render all (i.e. first render when page is opened)
			} else {
				$(facet.display).append(holder + sort + items + "</div>");
			}
		})
	}



	this.checkSelection = function (facet, item, item_count) {
		if(facet.selections.indexOf(item._id) !== -1)
			return "<input type='checkbox' checked id='"+facet.key + item_count +"' data-value='"+item._id+"'/>";
		else 
			return "<input type='checkbox' id='"+facet.key + item_count +"' data-value='"+item._id+"'/>";

	}

	this.joinArray = function (arr) {
		if(Array.isArray(arr)) 
			return arr.filter(Boolean).join(",");
		else
			return arr;
	}

	
	this.renderFilteredCount = function (target) {

		var filters = "?" + self.getFilteredQuery();
		
		if(filters == "?") {
			$(target).text("Lukumäärä: 0");	
			return;
		}
		// get items and render	
		$.getJSON(self.get_count_url + filters, function (response) {
			if(response.error)
				alert(response.error);
			else {
				$(target).text("Lukumäärä: " + response.count );
			}
			
		}).fail(function(jqXHR) {
			if (jqXHR.status == 404) {
				alert("GLAMpipe is not responding (404)!");
			} else {
				alert("GLAMpipe is not responding");
			}
		});
		
	}


	this.getFacetHeadingHTML = function (facet) {	 
		
		var head = "<div class='panel-heading'>";
		head += "	<h4 class='panel-title'>";
		head += "		<a data-toggle='collapse' href='#"+facet.key+"'><span class='glyphicon glyphicon-tag'></span> "+facet.title+"</a>";
		head += "	</h4>";
		head += "</div>";
		
		return head;
		

	}

	this.getFacetSortHTML = function (facet) {
		var collapse = "";
		if(facet.collapse == "collapse")
			collapse = "hidden";
			
		var sort = "<div data-facet='"+facet.key+"' class='btn-group sort-switch "+collapse+"' data-toggle='buttons'>";
		sort += "   <label data-sort='' class='btn btn-primary active'>";
		sort += "   	<input type='radio' name='"+facet.key+"_sort' checked autocomplete='off'> lukumäärä";
		sort += "	</label>";
		sort += "	<label data-sort='_id' class='btn btn-primary'>";
		sort += "		<input type='radio' name='"+facet.key+"_sort' autocomplete='off'> aakkosjärjestys";
		sort += "	</label>";
		sort += "</div>";		
		return sort;
	}

}

function getDate (str) {
	var date_str = str.split(" ")[0];
	return date_str.split("/").join(".");
}



