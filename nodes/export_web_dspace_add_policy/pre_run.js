
var base = context.node.params.required_url;
var bundle = context.node.settings.bundle;
var action = context.node.settings.action;
var group = context.node.settings.group;


out.pre_value = [];


function makePublic(resourceId) {
	var policy = {};
	policy.action = action.toUpperCase();
	policy.resourceId = resourceId;
	policy.groupId = group;
	policy.resourceType = "bitstream";
	policy.rpType = "TYPE_CUSTOM";
	policy.rpName = "GLAMpipe";
	policy.rpDescription = "Set by GLAMpipe";
	policy.startDate = null;
	policy.endDate = null;
	return policy;
}



// loop over all bitstreams
if(Array.isArray(context.doc[context.node.params.in_bitstream])) {
	context.doc[context.node.params.in_bitstream].forEach(function(bitstream, index) {
		out.console.log("sdf")
		if(bitstream.bundleName.toLowerCase() === bundle && group) {
			var policy = makePublic(bitstream.uuid);
			var options = {
				url: base + "/bitstreams/" + bitstream.uuid + "/policy",
				method: 'POST',
				json: policy,
				jar:true
			}
			out.pre_value.push(options);
		}
	})
}


out.console.log(out.pre_value);


