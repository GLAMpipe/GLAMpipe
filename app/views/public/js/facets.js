function refjyx (gp_url, collection, filters, item_table) {
	
	var self 					= this;
	this.collection 			= collection;
	this.url 					= gp_url;
	this.filters 				= filters;
	this.item_table 			= item_table;
	this.collection_url 		= this.url + "/collections/" + this.collection
	this.get_facet_url 			= this.collection_url + "/facet/";
	this.get_count_url 			= this.collection_url + "/count";
	this.get_filtered_items_url = this.collection_url + "/search";
	this.current_request		= null;
	this.facets 				= []; 
	this.facetsDiv 				= "#facets"; // display for selected facets


	this.renderFilters = function (div) {
		
		self.filters.forEach(function(filter) {
			if(filter.mode == "filter") {
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
				$(div).append(html);
			}
		})
		
 		
	}

	this.setFilterOnOff = function (key, value, checked) {
		self.filters.forEach(function(filter) {
			if(filter.key == key) {
				filter.values.forEach(function(checkbox) {
					if(checkbox.value == value)
						checkbox.checked = checked;
				})
			}
		})
	}


	// 
	this.getFilteredQuery = function () {
		var query = [];
		self.filters.forEach(function(filter) {
			filter.values.forEach(function(cb) {
				if(cb.checked)
					query.push(filter.key + "[]=" + encodeURIComponent(cb.value)); 
			})
		})
		return query.join("&");
	}


	this.readFilter = function(id) {
		var checked = this.readCheckboxes(id);
		var query = [];
		checked.forEach(function(filter) {
			query.push(id + "[]=" + filter);
		})
		if(query.length == 0)
			return "";
		var query = query.join("&");
		query += "&op=or";
		console.log(query);
		return query;
	}




	this.renderFilteredSet = function (target) {

		var filters = "?" + self.getFilteredQuery();
		var params = "&limit=500&sort=dc_title";
		var html = "<table><tr>";
		self.item_table.headers.forEach(function(header) {
			html += "<th>" + header + "</th>";
		})
		html += "</tr>";
		
		if(filters == "?") {
			html += "</table>";
			$(target).empty().append(html);	
			return;		
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
			$(target).empty().append(html);
		})
	}



	this.renderFacets = function (div) {
		self.filters.forEach(function(filter) {
			if(filter.mode == "facet") {
				self.renderFacet(filter, div);
			}
		})
	}

	this.renderFacet = function (facet, target) {

		var items = [];
		var filters = "?" + self.getFilteredQuery();
		if(filters == "?") {
			$("#" + facet.key).find("ul").empty();	
			return;
		}
		var params = "&limit=200&op=or";
		$.getJSON(self.get_facet_url + encodeURIComponent(facet.key) + filters + params, function (response) {
			console.log(response);
			response.count.forEach(function(item) {
				if(facet.render == "list") {
					items.push($("<li></li>").text(item._id + " (" + item.count + ")"));

				} else {
					items.push($("<li><a></a></li>").find("a").text(item._id + " (" + item.count + ")").data("facet", item._id).attr("href","#").end());
				}
				
			})
			
			if(document.getElementById(facet.key)) {
				$("#" + facet.key).find("ul").empty().append(items);
			} else {
				var holder = $("<div id='"+facet.key+"'><h3>"+facet.title+"</h3></div>");
				holder.append($("<ul>").addClass("facet-list").append(items));
				$(target).append(holder);
			}
		})
		
	}


	this.joinArray = function (arr) {
		if(Array.isArray(arr)) 
			return arr.filter(Boolean).join(",");
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
				alert("Other non-handled error type");
			}
		});
		
	}




}

function getDate (str) {
	var date_str = str.split(" ")[0];
	return date_str.split("/").join(".");
}


