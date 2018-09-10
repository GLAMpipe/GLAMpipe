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

		$.getJSON(self.get_facet_url + "?fields=" + fields + filters, function (response) {
			self.filters.forEach(function(filter) {
				$(".bucket").remove();
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
					self.renderFacet(filter, response);
					
					// if we have more than 99 entries, then re-fetch them as grouped by first character
					if(response.facets[0][filter.key].length > 99) {
						//self.renderBucket(filter, response);
						$.getJSON(self.get_facet_url + "?fields=" + filter.key + filters + "&bucket=" + filter.key, function (data) {
							self.renderBucket(filter, filter.key, data);
						})
					}
				}

			})
		})
	}


	this.renderFacet = function (facet, response) {

		var item_count = 0;

		var holder = "<div id='"+facet.key + "_holder' class='panel panel-default'>";
		var sort = self.getFacetSortHTML(facet);
		var items = "<div id='" + facet.key + "' class='panel-collapse "+facet.collapse+"'>";

		holder += self.getFacetHeadingHTML(facet);

		response.facets[0][facet.key].forEach(function(item) {
			item_count++;
			if(facet.render == "list") {
				//items.push($("<li></li>").text(item._id + " (" + item.count + ")"));

			} else if(facet.bucket) {
				items += "<a href='' class='bucket_link'>" + item._id + "</a> ";
				sort = "";
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
	}



	this.renderBucket = function(facet, facet_field, response) {
		facet.buckets = [];
		var items = "<div id='bucket-holder-" + facet_field + "' class='bucket'>"
		response.facets[0][facet_field].forEach(function(item) {
			items += "<a href='' class='bucket_link'>" + item._id + "</a> | ";
			facet.buckets.push({id: item._id, entries: item.entries});
		})
		items += "</div>";
		
		$("#bucket-holder-" + facet_field).remove();
		$(items).insertBefore("#" + facet_field);
		$("#bucket-holder-" + facet_field).hide();
	}

	this.showBucket = function(holder_id, id) {
		var item_count = 0;
		var splitted = holder_id.split("-");
		var key = splitted[splitted.length -1];
		$("#" + key).empty();
		self.filters.forEach(function(filter) { 
			if(filter.key == key) {
				filter.buckets.forEach(function(bucket) {
					if(bucket.id == id) {
						var items = "";
						bucket.entries.forEach(function(entry) {
							item_count++;
							items += "<div class='list-group-item checkbox checkbox-circle'>";
							//items += self.checkSelection(facet, item, item_count);
							items += '<input type="checkbox" id="' + key + item_count +'" data-value="' + entry.id.replace(/'/, "\'")+'"/>';
							//items += "<label >"+entry.id+" <span class='badge'>"+entry.count+"</span></label>";
							items += "<label for='"+key + item_count +"'>" + entry.id + " <span class='badge'>" + entry.count + "</span></label>";
							items += "</div>"
						})
						$("#" + key).empty().append(items)
					}
				})
			}
		})
		
	}



	this.generateCSV = async function() {


		var fields = self.item_table.rows.map(filter => filter.key)
		var csv = fields.join(",") + "\n";
		var count = 1;
		var count_total = 0;
		
		while(count > 0) {
			var result = await self.getFilteredSet();
			var data = result.data.map(item => {
				var s = [];
				for(field of fields) {
					if(Array.isArray(item[field])) {
						s.push('"' + item[field].join("|").replace('"', '\"') + '"');
					} else {
						s.push("");
					}
				}
				return s.join(",");
			})
				
			csv += "\n" + data.join("\n");
			count = result.data.length;
			count_total = count_total + result.data.length;
			console.log("count:" + count_total + " total:" + self.count)
			self.skip = self.skip + self.limit;
		}

		return csv;
	}

	this.downloadCSV = async function(filename) {
		var element = document.createElement('a');
		var text = await self.generateCSV();
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
		element.setAttribute('download', filename);

		element.style.display = 'none';
		document.body.appendChild(element);

		element.click();

		document.body.removeChild(element);
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
		//alert("not implemented yet!")
		//return;
		self.filters.forEach(function(filter) {
			if(filter.key == facet.key) {
				filter.sort = facet.value;
				if(facet.value == "_id") $("#bucket-holder-" + facet.key).show();
				else $("#bucket-holder-" + facet.key).hide();
				//self.renderFacet(filter);
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
			if(filter.op) {
				query.push(operator = "op[]=" + filter.key + ":" + filter.op);
			}
			if(filter.bucket) {
				query.push(operator = "bucket=" + filter.key);
			}
		})
		return query.join("&");
	}



	this.renderFilteredSet = function () {

		var filters = "?" + self.getFilteredQuery();
		//console.log(filters)
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
					if(row.render)
						html += "  <td><div class='strong'>" + row.render(item) + "</div></td>";
					else if(row.link)
						html += "  <td><div class='strong'>" + self.renderLinks(item[row.key], row) + "</div></td>";
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



	this.checkSelection = function (facet, item, item_count) {
		if(item._id) {
			if(facet.selections.indexOf(item._id) !== -1)
				return '<input type="checkbox" checked id="'+facet.key + item_count +'" data-value="'+item._id.replace(/'/, "\'")+'"/>';
			else
				return '<input type="checkbox" id="'+facet.key + item_count +'" data-value="'+item._id.replace(/'/, "\'")+'"/>';
		} else {
			return ""
		}
	}

	this.joinArray = function (arr) {
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
		sort += "   <label data-sort='' class='btn btn-primary active'>";
		sort += "   	<input type='radio' name='"+facet.key+"_sort' checked autocomplete='off'> by count";
		sort += "	</label>";
		sort += "	<label data-sort='_id' class='btn btn-primary'>";
		sort += "		<input type='radio' name='"+facet.key+"_sort' autocomplete='off'> by name";
		sort += "	</label>";
		sort += "</div>";
		return sort;
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



