
out.value = "";

// query result output as json
var data = context.data;

// check errors in request (for example 404)
if(context.error) {
	setter.error = context.error;
// check errors in query
} else if(data.error) {
	setter.error = data.error.info;
} else {
	if(data.query && data.query.allimages && data.query.allimages.length) {
		
		if(data.query.allimages[0].descriptionurl)
			out.value = data.query.allimages[0].descriptionurl;
		
		context.vars.success_counter++;
	}

}

if(parseInt(context.count) % 10 == 0) 
	out.say('progress', context.node.type.toUpperCase() + ': processed ' + context.count + '/' + context.doc_count);

