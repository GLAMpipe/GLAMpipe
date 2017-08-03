
var options = [];
var file = context.doc[context.node.params.in_field];

if(Array.isArray(file)) {
	file.forEach(function(f) {
		options.push({file: f})
	})
} else {
	options.push({file: file})
		
} 
	
out.pre_value = options;


