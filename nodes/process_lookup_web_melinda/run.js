
out.value = "";

// query result output as json
var data = context.data;

// check errors in request (for example 404)
if(context.error) {
	setter.error = context.error;
// check errors in query
} else if(data.resultCount) {

	if(data.records && data.records.length) {
		
		// we take first title
		if(data.records[0].title)
			out.value = data.records[0].title;
		
		context.vars.success_counter++;
	}

}

if(parseInt(context.count) % 10 == 0) 
	out.say('progress', context.node.type.toUpperCase() + ': processed ' + context.count + '/' + context.doc_count);

