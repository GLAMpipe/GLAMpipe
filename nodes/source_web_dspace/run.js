
var c = context;



// we must remove rest part from dspace_url (usually "/rest")
var splitted = context.node.params.required_dspace_url.split("/");
var dspace_url_stripped = splitted.slice(0, splitted.length-1).join("/");


if (context.response && context.response.statusCode == 200 ) {
	// count query rounds
	c.vars.round_counter++;

	if (context.data.items && context.data.items.length > 0) {
		
		out.say("progress", "procesed so far " + context.vars.record_counter );
		var updates = [];
		
		for (var i = 0; i < context.data.items.length; i++) {

			// count records 
			context.vars.record_counter++;
			makeRecord(context.data.items[i]); // this adds some fields to the original data
			
			if(context.node.settings.mode === "update" && context.node.settings.update_key) {
				if(!context.records.includes(context.data.items[i][context.node.settings.update_key])) { 
					updates.push(makeRecord(context.data.items[i]));
					context.vars.update_counter++;
				}
			} 
		}

		// OUTPUT
		if(context.node.settings.mode === "update")
			out.value = updates;
		else
			out.value = context.data.items;
		
		// URL for next round
		var offset = c.vars.round_counter * c.vars.limit;
        if(context.data["unfiltered-item-count"] == context.vars.limit)  /* check if there is any data left on the server */
             out.url = context.node.params.required_dspace_url + "/filtered-items" + context.node.settings.query + '&limit=' + c.vars.limit + '&offset=' + c.vars.round_counter * c.vars.limit; 
             
        out.say("progress", "Items fetched: " + context.vars.record_counter); 

	} else {
		out.say("progress", "no items found");
		out.value = null;
	}

}


function makeRecord(item) {

	// METADATA
	// expand metadata to arrays (key + "__lang" holds the language code)
	if (item.metadata && Array.isArray(item.metadata)) {
		// create arrays for every key
		for (var j = 0; j < item.metadata.length; j++) {
			var key = item.metadata[j].key;
			
			key = key.replace(/\./g, "_");
			item[key] = [];
			item[key + "__lang"] = [];
			
			// write keys to schema so that they get rendered
			// we also say that this is *always* an array
			out.add_display_key(key, "array");
			
		}
		
		// push values to array
		for (var j = 0; j < item.metadata.length; j++) {
			var key = item.metadata[j].key;
			//out.say("progress", key);
			key = key.replace(/\./g, "_");
			item[key].push(item.metadata[j].value);
			item[key + "__lang"].push(item.metadata[j].language);
		}
		
		// we save all language codes but show only certain ones
		out.add_display_key("dc_type__lang", "array");
	}
	
	// BITSTREAMS
	item["bitstream_original_file_url"] = [];
	item["bitstream_original_name"] = [];
	item["bitstream_original_format"] = [];
	item["bitstream_thumb_file_url"] = [];
	item["bitstream_thumb_format"] = [];
	
	if (item.bitstreams && item.bitstreams.constructor.name == "Array") {
		for (var j = 0; j < item.bitstreams.length; j++) {
			if (item.bitstreams[j].bundleName == "ORIGINAL" && item.bitstreams[j].type == "bitstream") {
				item["bitstream_original_file_url"].push(dspace_url_stripped + item.bitstreams[j].retrieveLink);
				item["bitstream_original_name"].push(item.bitstreams[j].name);
				item["bitstream_original_format"].push(item.bitstreams[j].format);
			}
			if (item.bitstreams[j].bundleName == "THUMBNAIL" && item.bitstreams[j].type == "bitstream") {
				item["bitstream_thumb_file_url"].push(dspace_url_stripped + item.bitstreams[j].retrieveLink);
				item["bitstream_thumb_format"].push(item.bitstreams[j].format);
			}
		}
	}
	return item;
}
