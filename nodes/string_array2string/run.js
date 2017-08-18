
var get = context.get; 
var doc = context.doc; 
var settings = context.node.settings; 
var params = context.node.params; 
var input = doc[params.in_field];
out.setter = {};

if(Array.isArray(input)) {
	out.setter[context.node.params.out_field] = input.join(settings.join);
} else {
	out.setter[context.node.params.out_field] = "";
}



if(parseInt(context.count) % 100 == 0) 
    out.say('progress', context.node.type.toUpperCase() + ': processed ' + context.count + '/' + context.doc_count);

