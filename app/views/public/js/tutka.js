

var item_table = {
		headers: ["title", "collaborator", "initiative", "linkki"],
		rows: [
			{
				key:"dc_title"
			},

			{
				key:"yvv_contractresearch_collaborator"
			},
			{
				key:"yvv_contractresearch_initiative"
				
			},
			{
				key: "dc_identifier_urn",
				render: function(item) {return makeURNLink(item[this.key], "linkki")}
			}
		]			

	}

var filters = [
		{
			title:"Minkä sidosryhmän/-ryhmien kanssa opinnäytetyö on tehty?",
			description: "",
			render: "checkbox",
			mode: "filter",
			key: "yvv_contractresearch_collaborator",
			op: "or",
			values: [
				{
					value:"business", title:"Yritykset", checked: true
				},
				{
					value:"community", title:"voittoa tavoittelemattomat yhteisöt", checked: true
				},
				{
					value:"finance", title:"Rahoitus- ja vakuutuslaitokset", checked: true
				},
				{
					value:"public", title:"Julkisyhteisöt", checked: true
				}
			]
		},
		{
			title:"Minkä osapuolen aloitteesta opinnäytetyö tehtiin?",
			description: "",
			render: "checkbox",
			mode: "filter",
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
			title:"Oppiaine",
			description: "",
			mode: "facet",
			render: "list",
			key: "oppiaine",
			op: "and",
			values: []
		}		
	];


function makeURNLink (arr, link) {
		if(Array.isArray(arr)) {
			var arr = arr.filter(Boolean);
			return "<a href='http://urn.fi/"+arr[0]+"'>" + link + "</a>";
		} else {
			return "<a href='http://urn.fi/" +arr+ "'>" + link + "</a>";
		}	
	}


$( document ).ready(function() {

	// GLAMpipe address
	var collection = "p42_jyx-tuotanto-gradut-csv_c2_2016";
	var gp_url = "http://localhost:3000/api/v1";
	var admin = new refjyx(gp_url, collection, filters, item_table);
	
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
	

	admin.renderFilters(".sidebar-right .filters");
	admin.renderFilteredSet("#items");
	admin.renderFacets(".sidebar-left");
	admin.renderFilteredCount(".sidebar-right .info");
	
	$(".filter-or input").click(function(e) {
		var d = $(e.target);
		var key = d.parents("div").attr("id");
		admin.setFilterOnOff(key, d.attr("value"), d.is(':checked'));
		admin.renderFilteredSet("#items");
		admin.renderFacets(".sidebar-left");
		admin.renderFilteredCount(".sidebar-right .info");
	})
	

	// click handler for facets
	$(document).on("click", ".facet-list li a", function(e) {
		var value = $(e.target).data("facet");
		var field = $(e.target).parents("div").attr("id");
		admin.addFilter(value, field, "facets1");
		e.preventDefault();
	})



	$(document).on("click", "div.facet i", function(e) {
		var value = $(e.target).parent().text();
		var field = $(e.target).parent().data("id");
		admin.removeFilter(value, field);
		e.preventDefault();
	})			


});


