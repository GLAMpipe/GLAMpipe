
var group = context.node.settings.group;
var mode = context.node.settings.mode;

function makePublic(resourceId) {
	var policy = {};
	policy.action = "READ";
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

out.value = [];

// loop over all bitstreams
if(Array.isArray(context.doc[context.node.params.in_bitstream])) {
	context.doc[context.node.params.in_bitstream].forEach(function(bitstream, index) {
		
		// pick corresponding policy array
		if(context.doc[context.node.params.in_policy] && context.doc[context.node.params.in_policy][index]) {
			var policies = context.doc[context.node.params.in_policy][index];
			out.value[index] = [];
			// looop over policies
			if(Array.isArray(policies)) {
				
				// in "non-public" mode remove READ policies and copy rest
				policies.forEach(function(policy) {
					//if(mode === "non-public") {
						if(policy.action != "READ") {
							out.value[index].push(policy)
						} 
					//}
					
				})
			} 
			
			if(mode === "public") {
				// add new READ policies
				var newPolicy = makePublic(bitstream.uuid);
				out.value[index].push(newPolicy);
			}
		}
	})
}
