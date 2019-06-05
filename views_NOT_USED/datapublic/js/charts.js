
$( document ).ready(function() {

	// GLAMpipe address
	var collection = "p5_jyx-artikkelit_c1_references";
	var gp_url = "http://localhost:3000";
	var admin = new refjyx(gp_url, collection);
	admin.facet2 = 
		{
			title: "facets2",
			field: "dc_contributor_laitos__splitted",
			limit: 100,
			sort: "_id",
			itemDiv: ".facet2-item",
			path: "/groupby/id",
			render: function(data) {
				//console.log("RENDERING: " + this.field)
				var target = $("#" + this.field);
				target.empty();
				var items = [];
				
				data.forEach(function(item) {
					if(!item._id.includes("Department") && !item._id.includes("Facult"))
						items.push($("<li><a></a></li>").find("a").text(item._id + "(" + item.count + ")").data("facet", encodeURIComponent(item._id)).attr("href","#").end());
				})
				target.append($("<ul>").addClass("facet-list").append(items));
				target.parent().accordion("refresh");

			}
	};
	
	admin.facet1 = {
			title: "facets1",
			itemDiv: ".facet1-item",
			path: "",
			render: function(data) {
				//console.log("RENDERING: " + this.field)
				var target = $("#" + this.field);
				target.empty();
				var items = [];
				
				data.forEach(function(item) {
					if(!item._id.includes("Department") && !item._id.includes("Facult"))
						//items.push($("<li></li>").text(item._id + "(" + item.count + ")").data("facet", encodeURIComponent(item._id)).attr("href","#").end());
						items.push($("<li><input type='checkbox'> "+item._id+" (" + item.count + ")</li>").find("input").data("facet", encodeURIComponent(item._id)).end());
				})
				target.append($("<ul>").addClass("facet-list no-bullets").append(items));
				target.parent().accordion("refresh");
			}
	};
	
	admin.init();
	admin.getCount("#lahteet");
	// get department list
	admin.getFacet(admin.facet2, "", admin.facet2.render)
	// get publishers facet
	admin.getFacets();

	var kaavio = new chart(gp_url, collection);
	
	// draw graph after queries are finished
	 $(document).ajaxStop(function () {
		  kaavio.plot();
	  });
	  
	// click handler for publishers
	$(document).on("change", ".facet1-item ul.facet-list li input", function(e) {

		var value = $(e.target).data("facet");
		var field = $(e.target).parents("div").attr("id");			
		if($(e.target).is(":checked")) {
			kaavio.setFilter1(decodeURIComponent(value), field);
		} else {
			kaavio.removeFilter1(decodeURIComponent(value));
		}
		console.log("filter: ");
		console.log(kaavio.filter1);
	})
	
	// click handler for departments
	$(document).on("click", ".facet2-item ul.facet-list li a", function(e) {
		var value = $(e.target).data("facet");
		var field = $(e.target).parents("div").attr("id");
		admin.resetFilters();
		kaavio.reset();
		admin.addFilter(value, field, "facets2"); // filter for right side facet
		kaavio.setFilter2(value, field); // filter for plot data
		$("#left-select").text(decodeURIComponent(value));
	})

	$( ".linkki" ).on("click",  function(event) { 
		kaavio.filter1.value = [];
		kaavio.filter1.datasets = [];
		kaavio.plot();
		event.preventDefault(); 
	 });

});
