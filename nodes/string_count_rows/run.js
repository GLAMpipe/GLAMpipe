

var val = context.doc[context.node.params.in_field]; 

if(parseInt(context.count) % 1000 == 0) 
	out.say('progress', context.node.type.toUpperCase() + ': processed ' + context.count + '/' + context.doc_count);


if(Array.isArray(val))
	out.value = val.length.toString();
else
	out.value = "0";
