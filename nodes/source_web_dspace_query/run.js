
var c = context;


if (context.response && context.response.statusCode == 200 ) {
	// count query rounds
	c.vars.round_counter++;

	if (context.data.items && context.data.items.length > 0) {
		
		out.say("progress", "procesed so far " + context.vars.record_counter );
		//out.say("progress", "TOTAL " + context.data.item-count );
		
		for (var i = 0; i < context.data.items.length; i++) {

			// count records 
			context.vars.record_counter++;
			

			// METADATA
			// expand metadata to arrays (key + "__lang" holds the language code)
			if (context.data.items[i].metadata && context.data.items[i].metadata.constructor.name == "Array") {
				// create arrays for every key
				for (var j = 0; j < context.data.items[i].metadata.length; j++) {
					var key = context.data.items[i].metadata[j].key;
					
					key = key.replace(/\./g, "_");
					context.data.items[i][key] = [];
					context.data.items[i][key + "__lang"] = [];
					
					// write keys to schema so that they get rendered
					// we also say that this is *always* an array
					out.add_display_key(key, "array");
					
				}
				
				// push values to array
				for (var j = 0; j < context.data.items[i].metadata.length; j++) {
					var key = context.data.items[i].metadata[j].key;
					//out.say("progress", key);
					key = key.replace(/\./g, "_");
					context.data.items[i][key].push(context.data.items[i].metadata[j].value);
					context.data.items[i][key + "__lang"].push(context.data.items[i].metadata[j].language);
				}
				
				// we save all language codes but show only certain ones
				out.add_display_key("dc_type__lang", "array");
			}
			
			// BITSTREAMS
			if (context.data.items[i].bitstreams && context.data.items[i].bitstreams.constructor.name == "Array") {
				context.data.items[i]["bitstream_original_file"] = [];
				context.data.items[i]["bitstream_original_name"] = [];
				context.data.items[i]["bitstream_original_format"] = [];
				for (var j = 0; j < context.data.items[i].bitstreams.length; j++) {
					if (context.data.items[i].bitstreams[j].bundleName == "ORIGINAL" && context.data.items[i].bitstreams[j].type == "bitstream") {
						context.data.items[i]["bitstream_original_file"].push(context.node.params.dspace_url + context.data.items[i].bitstreams[j].retrieveLink);
						context.data.items[i]["bitstream_original_name"].push(context.data.items[i].bitstreams[j].name);
						context.data.items[i]["bitstream_original_format"].push(context.data.items[i].bitstreams[j].format);
					}
				}
			}
		}

		// OUTPUT
		out.value = context.data.items;
		
		var limit = context.vars.limit - c.vars.round_counter * c.vars.offset;
		if (limit >= c.vars.offset)
			limit = c.vars.offset;

         /* check if there is any data left on the server */
        if(context.data.length == context.vars.offset && context.vars.record_counter < context.vars.limit) 
             out.url = context.node.settings.url + "/filtered-items" + context.node.settings.query + '&limit=' + limit + '&offset=' + c.vars.round_counter * c.vars.offset; 

	} else {
		out.say("progress", "no items found");
		out.value = null;
	}

}
