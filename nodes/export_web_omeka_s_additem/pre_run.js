
if(context.doc[context.node.params.in_field]) {
	var item = context.doc[context.node.params.in_field];

	// set item set
	item["o:item_set"] = [{"o:id":context.node.settings.collection}] 


	if(parseInt(context.count) % 10 == 0) 
		out.say("progress", context.node.type.toUpperCase() + ": processed " + context.count + "/" + context.doc_count);


	var options = {
		url: out.url,  // from init.js
		json:  item,
		headers: {
			"accept": "application/json"
		}
	};


	out.pre_value = options;
}
