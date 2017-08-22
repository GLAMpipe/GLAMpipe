
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
			


		}

		// OUTPUT
		out.value = context.data.items;
		
		// URL for next round
        if(context.data.batching && context.data.batching.next )  /* check if there is any data left on the server */
             out.url = context.data.batching.next; 
             
        out.say("progress", "Items fetched: " + context.vars.record_counter); 

	} else {
		out.say("progress", "no items found");
		out.value = null;
	}

}
