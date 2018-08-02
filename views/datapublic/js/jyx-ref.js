


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


});
