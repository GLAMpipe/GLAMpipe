
var setter = {};

// query result output as json
var data = context.data;

// check errors in request (for example 404)
if(context.error) {
	setter.error = context.error;
// check errors in query (for example invalid hash)
} else if(data.error) {
	setter.error = data.error.info;
} else {
	var images = data.query.allimages;
	setter[context.node.params.out_field] = [images.length];
	
	images.forEach(function(image, i) {
		setter[context.node.params.out_field].push(images[i].descriptionurl);
	})
	
	if(images.length)
		context.vars.success_counter++;

}

out.setter = setter;
