
out.value = "";

// query result output as json
var data = context.data;

// check errors in request (for example 404)
if(context.error) {
	out.value = out.error_marker + context.error;
// check errors in query
} else if(data && data.error) {
	out.value = out.error_marker + data.error.info;
} else {
	if(data && data.query && data.query.allimages && data.query.allimages.length) {
		
		if(data.query.allimages[0].descriptionurl)
			out.value = data.query.allimages[0].descriptionurl;
		
		context.vars.success_counter++;
	}

}

if(parseInt(context.count) % 10 == 0) 
	out.say('progress', context.node.type.toUpperCase() + ': processed ' + context.count + '/' + context.doc_count);

