
var c = context;

// we must remove rest part from dspace_url (usually "/rest")
var splitted = context.node.params.dspace_url.split("/");
var dspace_url_stripped = splitted.slice(0, splitted.length-1).join("/");


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
					
				}
				
				// push values to array
				for (var j = 0; j < context.data.items[i].metadata.length; j++) {
					var key = context.data.items[i].metadata[j].key;
					//out.say("progress", key);
					key = key.replace(/\./g, "_");
					context.data.items[i][key].push(context.data.items[i].metadata[j].value);
					context.data.items[i][key + "__lang"].push(context.data.items[i].metadata[j].language);
				}
				

			}
			
			// BITSTREAMS
			context.data.items[i]["bitstream_original_file_url"] = [];
			context.data.items[i]["bitstream_original_name"] = [];
			context.data.items[i]["bitstream_original_format"] = [];
			context.data.items[i]["bitstream_thumb_file_url"] = [];
			context.data.items[i]["bitstream_thumb_format"] = [];
			
			if (context.data.items[i].bitstreams && context.data.items[i].bitstreams.constructor.name == "Array") {
				for (var j = 0; j < context.data.items[i].bitstreams.length; j++) {
					if (context.data.items[i].bitstreams[j].bundleName == "ORIGINAL" && context.data.items[i].bitstreams[j].type == "bitstream") {
						context.data.items[i]["bitstream_original_file_url"].push(dspace_url_stripped + context.data.items[i].bitstreams[j].retrieveLink);
						context.data.items[i]["bitstream_original_name"].push(context.data.items[i].bitstreams[j].name);
						context.data.items[i]["bitstream_original_format"].push(context.data.items[i].bitstreams[j].format);
					}
					if (context.data.items[i].bitstreams[j].bundleName == "THUMBNAIL" && context.data.items[i].bitstreams[j].type == "bitstream") {
						context.data.items[i]["bitstream_thumb_file_url"].push(dspace_url_stripped + context.data.items[i].bitstreams[j].retrieveLink);
						context.data.items[i]["bitstream_thumb_format"].push(context.data.items[i].bitstreams[j].format);
					}
				}
			}
			
		}

		// OUTPUT
		out.value = context.data.items;
		
		// URL for next round
		var offset = c.vars.round_counter * c.vars.limit;
        if(context.data["unfiltered-item-count"] == context.vars.limit)  /* check if there is any data left on the server */
             out.url = context.node.params.dspace_url + "/filtered-items" + context.node.settings.query + '&limit=' + c.vars.limit + '&offset=' + c.vars.round_counter * c.vars.limit; 
             
        out.say("progress", "Items fetched: " + context.vars.record_counter); 

	} else {
		out.say("progress", "no items found");
		out.value = null;
	}

}
