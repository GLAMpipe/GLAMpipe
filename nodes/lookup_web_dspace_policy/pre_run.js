
var base = context.node.params.required_url;

// we must output array of options for Request module


// handle array
if(Array.isArray(context.doc[context.node.settings.in_bitstream])) {
	out.pre_value = [];
	var bitstreams = context.doc[context.node.settings.in_bitstream];
	bitstreams.forEach(function(bitstream) {
		var options = null;
		if(bitstream.uuid) {
			options = {
				url: base + "/bitstreams/" + bitstream.uuid + "/policy",
				method: 'GET'
			}
		} 
		out.pre_value.push(options);
	})

//handle non-array
} else if(context.doc[context.node.settings.in_bitstream]) {
	var bitstream = context.doc[context.node.settings.in_bitstream];
	var options = null;
	if(bitstream.uuid) {
		options = {
			url: base + "/bitstreams/" + context.doc[context.node.settings.in_bitstream].uuid + "/policy",
			method: 'GET'
		}
	}
	
	out.pre_value = [options];

// check if we have static values (eg. REST-api call from external app)
} else if(context.node.settings.bitstream_uuid_static) {
	options = {
		url: base + "/bitstreams/" + context.node.settings.bitstream_uuid_static + "/policy",
		method: 'GET'
	}
	out.pre_value = [options];
} else {
	context.error = out.error_marker + "No UUID found!"
}


