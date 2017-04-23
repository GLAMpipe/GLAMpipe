var c = context;
var collection_id = context.vars.collections[context.vars.initial_round_counter];

if (context.response && context.response.statusCode == 200 ) {
	// count query rounds
	c.vars.round_counter++;

	if (context.data && context.data.length > 0) {
		
		out.say("progress", "procesed so far " + context.vars.record_counter );
		
		for (var i = 0; i < context.data.length; i++) {

			// count records 
			context.vars.record_counter++;

			// did we reach the record limit by the user?
			if (context.vars.record_counter >= context.vars.limit)
				break;
			

			// METADATA
			// expand metadata to arrays (key + "__lang" holds the language code)
			if (context.data[i].metadata && context.data[i].metadata.constructor.name == "Array") {
				// create arrays for every key
				for (var j = 0; j < context.data[i].metadata.length; j++) {
					var key = context.data[i].metadata[j].key;
					
					key = key.replace(/\./g, "_");
					context.data[i][key] = [];
					context.data[i][key + "__lang"] = [];
					
					// write keys to schema so that they get rendered
					// we also say that this is *always* an array
					out.add_display_key(key, "array");
					
				}
				
				// push values to array
				for (var j = 0; j < context.data[i].metadata.length; j++) {
					var key = context.data[i].metadata[j].key;
					//out.say("progress", key);
					key = key.replace(/\./g, "_");
					context.data[i][key].push(context.data[i].metadata[j].value);
					context.data[i][key + "__lang"].push(context.data[i].metadata[j].language);
				}
				
				// we save all language codes but show only certain ones
				out.add_display_key("dc_type__lang", "array");
			}
			
			// BITSTREAMS expose some data from bitsream object
			if (context.data[i].bitstreams && context.data[i].bitstreams.constructor.name == "Array") {
				context.data[i]["bitstream_original_file_url"] = [];
				context.data[i]["bitstream_original_name"] = [];
				context.data[i]["bitstream_original_format"] = [];
				for (var j = 0; j < context.data[i].bitstreams.length; j++) {
					if (context.data[i].bitstreams[j].bundleName == "ORIGINAL" && context.data[i].bitstreams[j].type == "bitstream") {
						// we must remove rest part from dspace_url (usually "/rest")
						var splitted = context.node.params.dspace_url.split("/");
						var dspace_url_stripped = splitted.slice(0, splitted.length-1).join("/");
						context.data[i]["bitstream_original_file_url"].push(dspace_url_stripped + context.data[i].bitstreams[j].retrieveLink);
						context.data[i]["bitstream_original_name"].push(context.data[i].bitstreams[j].name);
						context.data[i]["bitstream_original_format"].push(context.data[i].bitstreams[j].format);
					}
				}
			}
		}

		// OUTPUT
		out.value = context.data;
		var limit = context.vars.limit - c.vars.round_counter * c.vars.offset;
		if (limit >= c.vars.offset)
			limit = c.vars.offset;

         /* check if there is any data left on the server */
        if(context.data.length == context.vars.offset && context.vars.record_counter < context.vars.limit) 
             out.url = c.node.params.dspace_url + "/collections/" + collection_id + context.vars.query_path + '&limit=' + limit + '&offset=' + c.vars.round_counter * c.vars.offset; 
             
		 out.say("progress", "Items fetched: " + context.vars.record_counter);

	} else {
		out.say("progress", "no items found");
		out.value = null;
	}

}
