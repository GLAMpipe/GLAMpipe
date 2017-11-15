

var val = context.doc[context.node.params.in_field];
out.console.log(context.node.settings.separator)

var newline = "";
if(context.node.settings.newline == "true")
	newline = "\n";

if( typeof val == "string" || typeof val == "number")  
	out.value = val + context.node.settings.separator + newline;
else
	out.value = JSON.stringify(val) + context.node.settings.separator + newline;


context.count++;


if(parseInt(context.count) % 100 == 0) 
    out.say('progress', context.node.type.toUpperCase() + ': processed ' + context.count + '/' + context.doc_count);

