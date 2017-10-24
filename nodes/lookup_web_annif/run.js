
out.value = "";

// query result output as json
var data = context.data;

// check errors in request (for example 404)
if(context.error) {
	out.value = out.error_marker + context.error;
	
// check errors in query
} else if(data) {
	out.value = data;
	context.vars.success_counter++;
}

out.say('progress', context.count + '/' + context.doc_count + ' processed...');

