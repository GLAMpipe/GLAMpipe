

var config = {

	// GLAMpipe address and collection
	gp_url: "http://localhost:3000/api/v1",
	collection: context.node.collection,


	item_table:{
		display: "#items",
		headers: ["title", "year", "dc.type", "linkki"],
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
			
	filters: []

}


context.node.settings.in_field.forEach(function(field, index) {
	if(field != "") {
		var filter = {
			mode: "facet",
			key: field,
			collapse: "collapse",
			display: ".sidebar-left .filters"
		}
			
		if(context.node.settings.label[index])
			filter.title = context.node.settings.label[index];
			
		config.filters.push(filter);
	}
})

out.value = config;


