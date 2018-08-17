function refjyx (config) {

	var self 					= this;
	this.config 				= config
	this.collection 			= config.collection;
	this.url 					= config.gp_url;
	this.filters 				= config.filters;
	this.item_table 			= null;
	this.dataRender				= null;
	this.skip					= 0;
	this.limit					= 50;
	this.sort					= "";

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
			if(!filter.sort) {
				filter.sort = "count";
				filter.sortReverse = false;
			}
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
		self.skip = 0;
		if(typeof self.dataRender !== "undefined" && self.dataRender !== null) {
			self.dataRender(self);
			self.renderFilters();
		} else {
			self.renderFilteredSet();
			self.renderFilters();
		}
	}

	this.getFacetFields = function() {
		var fields = self.filters.map(function(filter) {
			return filter.key;
		})
		return fields.join(",")
	}

	this.renderFilters = function () {

		var sort = "";
		var item_count = 0;
		var fields = self.getFacetFields();
		var filters = "&" + self.getFilteredQuery();

		// fetch facet values
		$.getJSON(self.get_facet_url + "?fields=" + fields + filters, function (response) {
			self.facetResponse = response;
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
		self.filters.forEach(function(filter) {
			if(filter.key == facet.key) {

				var index = filter.selections.indexOf(facet.value);
				if(index === -1) {
					if(facet.checked)
						filter.selections.push(facet.value);

				} else {
					if(!facet.checked)
						filter.selections.splice(index, 1);
				}

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
				if(filter.sort == facet.value) {
					filter.sortReverse = !filter.sortReverse;
				} else {
					filter.sort = facet.value;
					filter.sortReverse = false;
				}
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
		var params = "&skip="+self.skip+"&limit=" + self.limit;
		if(self.sort) {
			params += "&sort=" + self.sort;
			if(self.sortReverse) {
				params+= "&reverse=" + self.sortReverse;
			}
		}

		var html = "<table><tr>";
		self.item_table.headers.forEach(function(header, index) {
			html += "<th data-key='" + self.item_table.rows[index]["key"] + "'>" + header + "</th>";
		})
		html += "</tr>";

		$.getJSON(this.get_filtered_items_url + filters + params, function (response) {
			response.data.forEach(function(item) {
				self.item_table.rows.forEach(function(row) {
					var edit = self.createEditLink(item, row);
					if(row.render)
						html += "  <td><div class='strong'>" + row.render(item) + "</div></td>";
					else if(row.link)
						html += "  <td><div class='strong'>" + self.renderLinks(item[row.key], row) + "</div></td>";
					else if(row.key)
						html += "  <td><div class='strong'>" + self.joinArray(item[row.key]) + "</div>"+edit+"</td>";
					else
						html += "  <td><div class='strong'></div></td>";
				})
				html += "<tr>"
			})
			html += "</table>";
			$(self.item_table.display).empty().append(html);
		})
	}


	this.renderLinks = function(link, col) {

		var domain = "";
		if(col.domain) domain = col.domain;

		if(Array.isArray(link)) {
			var arr = [];
			arr.push("<ul>");
			link.forEach(function(l) {
				if(l != "")
					arr.push("<li><a target='_blank' href='" + domain + l  + "'>link</a></li>");
			})
			arr.push("</ul>");
			return arr.join("\n");
		} else {
			if(link != "")
				return "<a target='_blank' href='" + domain + link  + "'>link</a>";
		}
		return "";
	}

	this.renderFacet = function (facet) {

		var item_count = 0;
		var holder = "<div id='"+facet.key + "_holder' class='panel panel-default'>";
		var sortHTML = self.getFacetSortHTML(facet);
		var items = "<div id='" + facet.key + "' class='panel-collapse "+facet.collapse+"'>";
		holder += self.getFacetHeadingHTML(facet);
		
		var sortedData = self.sortFacetData(self.facetResponse, facet);
		sortedData.forEach(function(item) {
			if(item._id) {
				item_count++;
				if(facet.render == "list") {
					items.push($("<li></li>").text(item._id + " (" + item.count + ")"));

				} else {
					items +="<div class='list-group-item checkbox checkbox-circle'>";
					items += self.checkSelection(facet, item, item_count);
					items += "<label for='"+facet.key + item_count +"'>"+item._id+" <span class='badge'>"+item.count+"</span></label>";
					items += "</div>"
				}
			}

		})
		items += "</div>";

		// if facet holder exists, then update only items
		if(document.getElementById(facet.key)) {
			$("#" + facet.key + "_holder").find("#" + facet.key).replaceWith(items);
		// otherwise render all (i.e. first render when page is opened)
		} else {
			$(facet.display).append(holder + sortHTML + items + "</div>");
		}
	}

	this.sortFacetData = function(response, facet) {
		// we start from data that is sorted by count
		// note that this assumes that the facet data size is less than 100
		switch (facet.sort) {
			case "_id":
				if(facet.sortReverse) {
					return _.sortBy(response.facets[0][facet.key], "_id").reverse();
				} else {
					return _.sortBy(response.facets[0][facet.key], "_id");
				}
				break;
			case "count": 
				if(facet.sortReverse) {
					return response.facets[0][facet.key].slice().reverse();
				} else {
					return response.facets[0][facet.key];
				}
				break;
			default:
				return response.facets[0][facet.key];
		}
		
		
	}

	this.checkSelection = function (facet, item, item_count) {
		if(facet.selections.indexOf(item._id) !== -1)
			return "<input type='checkbox' checked id='"+facet.key + item_count +"' data-value='"+item._id+"'/>";
		else
			return "<input type='checkbox' id='"+facet.key + item_count +"' data-value='"+item._id+"'/>";

	}

	this.joinArray = function (arr) {
		if(!arr || typeof arr === "undefined") return "";
		if(Array.isArray(arr))
			return arr.filter(Boolean).join(",");
		else
			return arr;
	}


	this.renderFilteredCount = function (target) {

		var filters = "?" + self.getFilteredQuery();

		// get items and render
		$.getJSON(self.get_count_url + filters, function (response) {
			if(response.error)
				alert(response.error);
			else {
				self.count = response.count;
				if((self.skip + self.limit) > response.count) {
					$("#data-switch").text(response.count + " / " +response.count);
				} else {
					$("#data-switch").text(self.skip + self.limit + " / " +response.count);
				}
			}

		}).fail(function(jqXHR) {
			if (jqXHR.status == 404) {
				alert("GLAMpipe is not responding (404)!");
			} else {
				alert("GLAMpipe is not responding");
			}
		});

	}

	this.nextPage = function () {
		if(self.skip + self.limit < self.count) {
			self.skip = self.skip + self.limit;
			self.renderFilteredSet();
			self.renderFilteredCount();
		}
	}

	this.prevPage = function () {
		if(self.skip == 0) return;
		self.skip = self.skip - self.limit;
		if(self.skip < 0) self.skip = 0;
		self.renderFilteredSet();
		self.renderFilteredCount();
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
		sort += "   <label data-sort='count' class='btn btn-primary active'>";
		sort += "   	<input type='radio' name='"+facet.key+"_sort' checked autocomplete='off'> lukumäärä";
		sort += "	</label>";
		sort += "	<label data-sort='_id' class='btn btn-primary'>";
		sort += "		<input type='radio' name='"+facet.key+"_sort' autocomplete='off'> aakkosjärjestys";
		sort += "	</label>";
		sort += "</div>";
		return sort;
	}


	this.createEditLink = function(item, row) {
		if(row.editable)
			if(row.options) {
				return "<a title='edit' href='' class='edit-options' data-id='"+item._id+"' data-key='"+row.key+"' data-options='"+row.options.join('|')+"'><span class='glyphicon glyphicon-pencil'></span></a>";
			} else {
				return "<a title='edit' href='' class='edit-key' data-id='"+item._id+"' data-key='"+row.key+"'><span class='glyphicon glyphicon-pencil'></span></a>";
			}
		else
			return "";
	}

	this.renderDropdown = function(e) {
		var d = $(e.target).parent();
		var holder = d.parent();
		var text = d.parents("td").text();
		d.hide();
		d.parent().find("div").hide();
		
		var options = d.data("options").split("|");
		var key = d.data("key");
		var id = d.data("id");
		if(options) { 
			var html = "<select class='edit-dropdown' data-id='"+id+"' data-key='"+key+"'><option value=''>valitse</option>"
			options.forEach(function(option) {
				if(text && typeof text === "string" && text.split(":")[0] == option) {
					html += "<option selected>" + option + "</option>"
				} else {
					html += "<option>" + option + "</option>"
				}
			})
			html += "</select><button class='cancel-key'>peru</button>";
			holder.append(html);
		} 
	}


	this.saveStatusDropdown = function(d) {

		var url = config.gp_url + "/collections/" + config.collection + "/docs/" + d.data("id");
		var options = {};
		var user = getUserShort();
		if(!d.val()) {
			options[d.data("key")] = "";
		} else {
			if(user) {
				options[d.data("key")] = d.val() + ": " + user;
			} else {
				options[d.data("key")] = d.val();
			}
		}
		$.post(url, options, function (response) {
			if(response.error) {
				alert(response.error);
			} else {
				self.renderFilters();
				self.renderFilteredSet(); 
			}
		}).fail(function() {
				alert("Virhe talletuksessa!");
			})
	}

	this.saveEdit = function(d) {

		var text = d.parent().find("textarea").val();
		var url = config.gp_url + "/collections/" + config.collection + "/docs/" + d.data("id");
		var options = {};
		options[d.data("key")] = text;
		$.post(url, options, function (response) {
			if(response.error)
				alert(response.error);
			else {
				d.parent().find("div").text(text);
				d.parent().find("div").show();
				d.parent().find(".edit-key").show();
				d.parent().find("textarea").remove();
				d.parent().find("button").remove();
			}
		}).fail(function() {
			alert("Virhe talletuksessa!");
		})
	}

	this.cancelEdit = function(d) {

		$("table div").show();
		$("table .edit-key").show();
		$("table .edit-options").show();
		$("table textarea").remove();
		$("table select").remove();
		$("table button").remove();

	}

	this.doPoll = function() {
		$.get(config.gp_url + "/status" , function(data) {
			setTimeout(self.doPoll,30000);
		}).fail(function(jqXHR) {
			alert("Istuntosi vanheni! Lataa sivu uudestaan." )
			//window.location.reload(true);
		})
	}

}

function getDate (str) {
	var date_str = str.split(" ")[0];
	return date_str.split("/").join(".");
}



