
// initial config
var config = {

	// GLAMpipe address and collection
	gp_url:  context.node.req.protocol + "://" + context.node.req.headers.host + "/api/v1",
	collection: context.node.collection,
	pageinfo: "",

	item_table:{
		display: "#items",
		headers: [],
		rows: 	 []
	},	
			
	filters: []
}

// link renderer code for item table 
var renderLink = function (item) {
	if(item[this.key] != '')
		return "<a href='" + item[this.key] + "'>link</a>";
	else
		return "";
	}

// inputs are numbered instead of using arrays. This makes "remembering" of setting more generic in the UI side
var facets = [];
facets.push(context.node.settings.in_field_1);
facets.push(context.node.settings.in_field_2);
facets.push(context.node.settings.in_field_3);
//facets.push(context.node.settings.in_field_4);

facets.forEach(function(field, index) {
	if(field != "") {
		var facet_index = index + 1;
		var filter = {
			mode: "facet",
			key: field,
			collapse: "collapse",
			display: ".sidebar-left .filters"
		}
			
		if(context.node.settings["label_" + facet_index])
			filter.title = context.node.settings["label_" + facet_index];
		else
			filter.title = "facet " + facet_index;
			
		if(context.node.settings["collapsed_" + facet_index] === "false")
			filter.collapse = "in";

		if(context.node.settings["display_" + facet_index] === "right")
			filter.display = ".sidebar-right .filters";		
			
		config.filters.push(filter);
	}
})

var renders = [];
renders.push(context.node.settings.render_1);
renders.push(context.node.settings.render_2);
renders.push(context.node.settings.render_3);
//renders.push(context.node.settings.render_4);

renders.forEach(function(key, index) {
	if(key != "") {
		var key_index = index + 1;
		var column = {
			key: key
		}	
		
		//table headers
		if(context.node.settings["render_label_" + key_index])	
			config.item_table.headers.push(context.node.settings["render_label_" + key_index]);
		else
			config.item_table.headers.push(key);
			
		// link render
		if(context.node.settings["render_link_" + key_index] === "true") {
			column.link = true;
			column.domain = context.node.settings["render_link_start_" + key_index]
		}
			
		config.item_table.rows.push(column);
	}
})

// if item rendering is empty then puth first key so that user sees something
if(config.item_table.rows.length == 0)
	config.item_table.rows.push({key:context.node.settings.in_field_1});
	

//if(context.node.settings.pageinfo != "")
	//config.pageinfo = context.node.settings.pageinfo;

out.value = config;


