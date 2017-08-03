


out.setter = {};

if(context.data && context.response && context.response.statusCode === 200) {
	if(context.data.result.length)
		context.vars.success_counter++;
	out.setter[context.node.params.out_result] = context.data.result;
}


if(parseInt(context.count) % 10 == 0) 
	out.say('progress', context.node.type.toUpperCase() + ': processed ' + context.count + '/' + context.doc_count);



