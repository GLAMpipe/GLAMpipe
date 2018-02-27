
out.value = "";

// query result output as json
var data = context.data;

// check errors in request (for example 404)
if(context.error) {
	let error = out.error_marker + context.error;
	if(context.error === "no URL")
		error = out.error_marker + "no WID"
	out.setter = {};
	out.setter[context.node.params.out_field] = error;
	out.setter[context.node.params.out_modified] = error;
// check errors in query
} else if(data && data.error) {
	
} else if(data) {

	var mode = context.node.params.mode;
	switch(mode) {
		case "revision":
			out.setter = getRevision();
		break;
	}
	context.vars.success_counter++;
}

if(parseInt(context.count) % 10 == 0) 
	out.say('progress', context.node.type.toUpperCase() + ': processed ' + context.count + '/' + context.doc_count);


function getRevision() {
	if(data && data.entities && Object.keys(data.entities).length == 1) {
		var item = data.entities[Object.keys(data.entities)[0]];
		var setter = {};
		setter[context.node.params.out_field] = item.lastrevid.toString();
		setter[context.node.params.out_modified] = item.modified;
		return setter;
	}
	return {};

}
