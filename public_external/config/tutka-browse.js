
var config = {
	// GLAMpipe address and collection
	gp_url: g_apipath,
	//collection: "p17_admin-tutka-testi2_c0_artikkelit",
	collection: "p71_jyxadmin-tutka-data_c0_data",

	item_table:{
		display: "#items",
		sort: "year",
		reverse: 1,
		headers: ["title", "tutka", "year", "tyyppi", "as_name", "JUFO", "OA"],
		rows: [
			{
				key:"pub_name",
				render: function(item) {
						var laitos = "";
						for(var i = 0; i < item.getrecordorganizationnames__replaced__splitted.length; i++) {
							laitos += " - " + item.getrecordorganizationnames__replaced__splitted[i] + "</br>";
						}
						return item.pub_name + "<div class='smaller'> " + laitos + "</div>";
					}
				
			},
			{
				key:"id",
				render: function (item) {
					return "<a target='_blank' href=\"" + item.id + "\">tutka</a>";
				}
			},
			{
				key:"year"
			},
			{
				key:"pubtype_name"
			},
			{
				key:"as_name"
			},
			{
				key:"jufoclass"
			},
			{
				key:"open_access_homepage",
				render: function (item) {
					if(item.open_access_homepage != '')
						return "<a target='_blank' href=\"" + item.open_access_homepage + "\">oa</a>";
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
			render: "checkbox",
			mode: "static",
			key: "year",
			op: "or",
			display: ".sidebar-right .filters",
			values: [
				{
					value:"2017", title:"2017", checked: true
				},
				{
					value:"2016", title:"2016", checked: false
				},
				{
					value:"2015", title:"2015", checked: false
				}
			]
		},
		{
			title:"Rinnakkaistallennettu",
			description: "",
			render: "checkbox",
			mode: "static",
			key: "has_url",
			op: "or",
			display: ".sidebar-right .filters",
			values: [
				{
					value:"yes", title:"kyllä", checked: true
				},
				{
					value:"no", title:"ei", checked: false
				}
			]
		},
		{
			title:"julkaisutyyppiluokitus",
			description: "",
			render: "checkbox",
			mode: "facet",
			key: "pubtype_name",
			collapse: "collapse",
			display: ".sidebar-right .filters"

		},

		{
			title:"Laitos",
			description: "",
			mode: "facet",
			render: "link",
			key: "getrecordorganizationnames__replaced__splitted",
			op: "and",
			collapse: "in",
			display: ".sidebar-left"
		},
		{
			title:"Julkaisija",
			description: "",
			mode: "facet",
			render: "link",
			key: "publisher",
			op: "and",
			display: ".sidebar-right .filters"
		},
		{
			title:"Lehti (as_name)",
			description: "",
			mode: "facet",
			render: "link",
			key: "as_name",
			op: "and",
			display: ".sidebar-right .filters"
		}
	
	]
}
