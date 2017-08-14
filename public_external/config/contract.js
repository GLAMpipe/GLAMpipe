
var config = {
	// GLAMpipe address and collection
	gp_url: g_apipath,
	collection: "p7_jyxadmin-gradut-csv_c0_gradut",

	item_table:{
		display: "#items",
		sort: "dc_date_issued",
		reverse: "1",
		headers: ["title", "year", "collaborator", "initiative", "linkki"],
		rows: [
			{
				key:"dc_title"
			},
			{
				key:"dc_date_issued"
			},
			{
				key:"yvv_contractresearch_collaborator"
			},
			{
				key:"yvv_contractresearch_initiative"
			},
			{
				key: "dc_identifier_urn",
				render: function(item) {return makeURNLink(item[this.key], "JYX")}
			}
		]			

	},

	filters: [
		{
			title:"Julkaisuvuosi",
			description: "",
			render: "checkbox",
			mode: "static",
			key: "dc_date_issued",
			op: "or",
			display: ".sidebar-right .filters",
			values: [
				{
					value:"2017", title:"2017", checked: false
				},
				{
					value:"2016", title:"2016", checked: true
				},
				{
					value:"2015", title:"2015", checked: false
				}
			]
		},
		{
			title:"Minkä sidosryhmän/-ryhmien kanssa opinnäytetyö on tehty?",
			description: "",
			render: "checkbox",
			mode: "static",
			key: "yvv_contractresearch_collaborator",
			op: "or",
			display: ".sidebar-right .filters",
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
			mode: "static",
			key: "yvv_contractresearch_initiative",
			op: "or",
			display: ".sidebar-right .filters",
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
			render: "link",
			key: "oppiaine",
			collapse: "in",
			display: ".sidebar-left"
		}		
	]
}
