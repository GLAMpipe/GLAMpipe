function refjyx (gp_url, collection) {
	
	var self 					= this;
	this.collection 			= collection;
	this.url 					= gp_url;
	this.collection_url 		= this.url + "/collections/" + this.collection
	this.get_facet_url 			= this.collection_url + "/facet/";
	this.get_count_url 			= this.collection_url + "/count";
	this.get_filtered_items_url = this.collection_url + "/search";
	this.current_request		= null;
	this.facets 				= []; 
	this.facetsDiv 				= "#facets"; // display for selected facets


	this.filters = [
		{
			title:"Minkä sidosryhmän/-ryhmien kanssa opinnäytetyö on tehty?",
			description: "",
			mode: "checkbox",
			key: "yvv_contractresearch_collaborator",
			op: "or",
			values: [
				{
					value:"business", title:"Yritykset", checked: false
				},
				{
					value:"community", title:"voittoa tavoittelemattomat yhteisöt", checked: false
				},
				{
					value:"finance", title:"Rahoitus- ja vakuutuslaitokset", checked: false
				},
				{
					value:"public", title:"Julkisyhteisöt", checked: false
				}
			]
		},
		{
			title:"Minkä osapuolen aloitteesta opinnäytetyö tehtiin?",
			description: "",
			mode: "checkbox",
			key: "yvv_contractresearch_initiative",
			op: "or",
			values: [
				{
					value:"order", title:"yrityksen tms. tilaamana ", checked: false
				},
				{
					value:"student", title:"opiskelijan omasta kiinnostuksesta ", checked: false
				},
				{
					value:"university", title:"yliopiston tarjoamana ", checked: false
				}
			]
		},
		{
			title:"Minkä osapuolen aloitteesta opinnäytetyö tehtiin?",
			description: "",
			mode: "facet",
			key: "dc_contributor_oppiaine",
			op: "and",
			values: []
		}		
	];

	this.init = function () {
		
		// read facets from DOM (simple grouping)
		//readFacets("facet-and");
		this.renderFilters(".sidebar-right");	
		this.renderFacets(".sidebar-left");

	}

	this.renderFilters = function (div) {
		
		self.filters.forEach(function(filter) {
			var html = "<div class='filter-"+filter.op+"' id='"+filter.key+"'>";
			html += "<h3>" + filter.title + "</h3><ul>";
			if(filter.mode == "checkbox") {
				filter.values.forEach(function(value) {
					html += "<li><input type='checkbox'  value='"+value.value+"'/>"+value.title+"</li>"
				})
			}
			html += "</ul></div>";
			$(div).append(html);
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
		var query = query.join("&");
		query += "&op=or";
		console.log(query);
	}


	this.getFilteredSet = function () {

		var filters = "?" + self.getFilteredQuery();
		var params = "&limit=500&sort=dc_title&op=or";
		var html = "<table>";
		html += "<tr><th>title</th><th>collaborator</th><th>initiative</th><th>linkki</th></tr>"
		$.getJSON(this.get_filtered_items_url + filters + params, function (response) {
			response.data.forEach(function(item) {
				html += "<tr>"
				html += "  <td><div class='strong'>" + item.dc_title + "</div></td>";
				
				html += "  <td>";
				if(item.yvv_contractresearch_collaborator)
					html += "  <div>" + self.joinArray(item.yvv_contractresearch_collaborator)+ "</div>";
				html += "  </td>";
				
				html += "  <td>";
				if(item.yvv_contractresearch_initiative)
					html += "  <div>" + self.joinArray(item.yvv_contractresearch_initiative)+ "</div>";
				html += "  </td>";


				html += "  <td>";
				if(item.dc_identifier_urn)
					html += "  <div>" + self.makeURNLink(item.dc_identifier_urn, "linkki")+ "</div>";
				html += "  </td>";
					
				html += "</tr>";
				
			})
			html += "</table>";
			$("#items").empty().append(html);
			
			
		})
		
	}

	this.renderFacets = function (div) {
		self.filters.forEach(function(filter) {
			if(filter.mode == "facet") {
				self.getFacetValues(filter);
			}
		})
	}

	this.getFacetValues = function (facet) {

		var filters = "?" + self.getFilteredQuery();
		var params = "&limit=500&sort=dc_title&op=or";
		var html = "<tr><th>title</th><th>collaborator</th><th>initiative</th><th>linkki</th></tr>"
		$.getJSON(self.get_facet_url + encodeURIComponent(facet.key) + filters + params, function (response) {
			console.log(response);
		})
		
	}
















	this.readFacets = function (facetGroup) {
		var s = "div" + self[facetGroup].itemDiv  +" div";
		console.log(s)
		$("div" + self[facetGroup].itemDiv  +" div").each(function(index) {
			var sort = (typeof $(this).data("sort") !== "undefined" ? $(this).data("sort") : null);
			var limit = (typeof $(this).data("limit") !== "undefined" ? $(this).data("limit") : 20);
			var mode = (typeof $(this).data("mode") !== "undefined" ? $(this).data("mode") : "facet");
			self.facets.push({
				field:$(this).attr("id"), 
				values: [], 
				path: self[facetGroup].path,
				render: self[facetGroup].render,
				map: self[facetGroup].map,
				mapto: self[facetGroup].mapto,
				sort: sort,
				limit: limit,
				mode: mode
			});
		})		
	}

	this.addFilter = function(value, field) {
		var index = self.facets.findIndex(function(facet) {return facet.field == field });
		if(index !== -1) {
			if(!self.facets[index].values.includes(value)) {
				self.facets[index].values.push(value);
				self.renderChosenFacets();
				self.getFacets();
				self.getFilteredSet();
			}
		} else {
			console.log("not found " + field);
			console.log("not found " + index);
		}
	}

	this.resetFilters = function () {
		self.facets.forEach(function(facet) {
			facet.values = [];
		})
	}

	this.removeFilter = function(value, field) {
		var index = self.facets.findIndex(function(facet) {return facet.field == field});
		if(index !== -1) {
			self.facets[index].values.splice(self.facets.indexOf(value),1);
		} 
		self.renderChosenFacets();
		self.getFacets();
		self.getFilteredSet();
	}

	this.renderChosenFacets = function () {
		$(self.facetsDiv).empty();
		self.facets.forEach(function(facet) {
			facet.values.forEach(function(value) {
				$(self.facetsDiv).append($("<div>").attr("data-id",facet.field).addClass("facet").text(decodeURIComponent(value)).append(" <i class='glyphicon glyphicon-remove'></i>"));
			})
		});

	}

	

	this.getFacets = function () {
		
		var filters_arr = [];
		//self.getFilters(filters_arr);
		var filters = "?" + filters_arr.join("&");
		
		self.facets.forEach(function(facet) {
			if(facet.mode !== "list") // 
				self.getFacet(facet,  filters);
			else 
				self.getFacet(facet,  "");
				
		})
	}




	this.joinArray = function (arr) {
		if(Array.isArray(arr)) 
			return arr.filter(Boolean).join(",");
	}

	this.makeURNLink = function (arr, link) {
		if(Array.isArray(arr)) {
			var arr = arr.filter(Boolean);
			return "<a href='http://urn.fi/"+arr[0]+"'>" + link + "</a>";
		} else {
			return "<a href='http://urn.fi/" +arr+ "'>" + link + "</a>";
		}	
	}

	this.getFacet = function (facet, filters) {
		
		var target = "#" + facet.field;
		$(target).empty().append("loading...");
		var params = []
		if(facet.sort)
			params.push("sort=" + facet.sort);
			
		if(facet.limit)
			params.push("limit=" + facet.limit);
			
		params = params.join("&");
		if(filters === "")
			params = "?" + params;
		else
			params = "&" + params;
			
		// get items and render	
		$.getJSON(self.get_facet_url + encodeURIComponent(facet.field) + facet.path + filters + params, function (response) {
			if(response.error)
				alert(response.error);
			else {
				if(facet.render) {
					facet.render(response.count);
				} else {
					$(target).empty();
					var items = [];
					response.count.forEach(function(item) {
						// map values
						if(facet.map) {
							var index = facet.map.indexOf(item._id);
							if(index !== -1)
								items.push($("<li><a></a></li>").find("a").text(facet.mapto[index] + " (" + item.count + ")").data("facet", item._id).attr("href","#").end());

						} else {
							// create html
							if(item._id === "") 
								items.push($("<li><a></a></li>").find("a").text("EI ARVOA (" + item.count + ")").data("facet", item._id).attr("href","#").end());
							else
								items.push($("<li><a></a></li>").find("a").text(item._id + " (" + item.count + ")").data("facet", item._id).attr("href","#").end());
						}
					})
					$(target).append($("<ul>").addClass("facet-list").append(items));
					//$(target).parent().accordion("refresh");
				}
			}
			
		}).fail(function(jqXHR) {
			if (jqXHR.status == 404) {
				alert("GLAMpipe is not responding (404)!");
			} else {
				console.log("ERROR in request");
			}
		});
		
	}

	
	this.getCount = function (targetDiv) {

		// get items and render	
		$.getJSON(self.get_count_url, function (response) {
			if(response.error)
				alert(response.error);
			else {
				$(targetDiv).text("RINNAKKAISJULKAISUPROSENTIT (" + response.count + ")");
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


