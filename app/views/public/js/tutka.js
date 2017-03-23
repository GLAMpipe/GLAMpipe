


$( document ).ready(function() {

	// GLAMpipe address
	var collection = "p42_jyx-tuotanto-gradut-csv_c2_2016";
	var gp_url = "http://localhost:3000/api/v1";
	var admin = new refjyx(gp_url, collection);
	
	admin.facet2 = 
		{
			title: "facets2",
			itemDiv: ".facet2-item",
			path: "",
			facets: []
	};
	
	admin.facet1 = {
			title: "facets1",
			itemDiv: ".facet1-item",
			path: ""
	};
	
	admin.init();
	admin.getFacets();
	
	$(".filter-or input").click(function(e) {
		var d = $(e.target);
		var key = d.parents("div").attr("id");
		admin.setFilterOnOff(key, d.attr("value"), d.is(':checked'));
		admin.getFilteredSet();
	})
	

	// click handler for facets
	$(document).on("click", ".facet1-item ul.facet-list li a", function(e) {
		var value = $(e.target).data("facet");
		var field = $(e.target).parents("div").attr("id");
		admin.addFilter(value, field, "facets1");
		e.preventDefault();
	})

	$(document).on("click", ".facet2-item ul.facet-list li a", function(e) {
		var value = $(e.target).data("facet");
		var field = $(e.target).parents("div").attr("id");
		admin.addFilter(value, field, "facets2");
		e.preventDefault();
	})

	$(document).on("click", "div.facet i", function(e) {
		var value = $(e.target).parent().text();
		var field = $(e.target).parent().data("id");
		admin.removeFilter(value, field);
		e.preventDefault();
	})			


});


