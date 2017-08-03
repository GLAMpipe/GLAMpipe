
var output = {};
output[context.node.params.out_ext] = "";
output[context.node.params.out_mime] = "";
out.setter = output;

// query result output as json
var data = context.data;

// check errors in request ()
if(context.error) {
	setter.error = context.error;
// check errors in query
} else if(data && data.error) {
	
} else if(data) {
	output[context.node.params.out_ext] = data.ext;
	output[context.node.params.out_mime] = data.mime;

}

if(parseInt(context.count) % 10 == 0) 
	out.say('progress', context.node.type.toUpperCase() + ': processed ' + context.count + '/' + context.doc_count);


