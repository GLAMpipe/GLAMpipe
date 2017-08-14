


$( document ).ready(function() {

	// GLAMpipe address
	var collection = "p17_admin-tutka-testi2_c0_artikkelit";
	var gp_url = "http://localhost:3000/api/v1";
	var admin = new refjyx(gp_url, collection);
	admin.facet2 = 
		{
			title: "facets2",
			itemDiv: ".facet2-item",
			path: "/groupby/id",
			facets: []
	};
	
	admin.facet1 = {
			title: "facets1",
			itemDiv: ".facet1-item",
			path: ""
	};
	
	admin.init();
	admin.getCount("#lahteet");
	admin.getFacets();

	// click handler for facets
	$(document).on("click", ".facet1-item ul.facet-list li a", function(e) {
		var value = $(e.target).data("facet");
		var field = $(e.target).parents("div").attr("id");
		admin.addFilter(value, field, "facets1");
	})

	$(document).on("click", ".facet2-item ul.facet-list li a", function(e) {
		var value = $(e.target).data("facet");
		var field = $(e.target).parents("div").attr("id");
		admin.addFilter(value, field, "facets2");
	})

	$(document).on("click", "div.facet i", function(e) {
		var value = $(e.target).parent().text();
		var field = $(e.target).parent().data("id");
		admin.removeFilter(value, field);
	})			

	console.log("******************************");
	console.log(admin.facets);

	$( ".show-all" ).on("click",  function(event) { 
		alert("not implemented");
		event.preventDefault(); 
	 });

});
