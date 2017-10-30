
var base = context.node.params.required_url;


// handle array
if(Array.isArray(context.doc[context.node.params.in_bitstream_uuid])) {
	out.pre_value = [];
	var bitstreams = context.doc[context.node.params.in_bitstream_uuid];
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
} else if(context.doc[context.node.params.in_bitstream_uuid]) {
	var bitstream = context.doc[context.node.params.in_bitstream_uuid];
	var options = null;
	if(bitstream.uuid) {
		options = {
			url: base + "/bitstreams/" + context.doc[context.node.params.in_bitstream_uuid].uuid + "/policy",
			method: 'GET'
		}
	}
	
	out.pre_value = [options];
}




