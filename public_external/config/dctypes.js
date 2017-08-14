


var config = {

	// GLAMpipe address and collection
	gp_url: g_apipath,
	collection: "p9_jyxadmin-artikkelit_c0_artikkelit",

	item_table:{
		display: "#items",
		headers: ["title", "year", "dc.type", "version", "linkki"],
		rows: [
			{
				key:"dc_title"
			},

			{
				key:"dc_date_issued"
			},
			{
				key:"dc_type"
			},
			{
				key:"version"
			},
			{
				key: "dc_identifier_urn",
				render: function (item) {
					if(item.dc_identifier_urn != '')
						return makeURNLink(item[this.key], "linkki");
					else
						return "";
					}
			}
		]			
	},


	filters: [
		{
			title:"Julkaisuvuosi",
			description: "",
			mode: "facet",
			key: "year",
			collapse: "in",
			display: ".sidebar-right .filters"
		},

		{
			title:"dc.description.version",
			description: "",
			mode: "facet",
			render: "link",
			key: "version",
			collapse: "in",
			display: ".sidebar-left .filters"
		},
		
		{
			title:"dc.type",
			description: "",
			mode: "facet",
			render: "link",
			key: "type",
			collapse: "",
			display: ".sidebar-left .filters"
		}
		
	]
}
