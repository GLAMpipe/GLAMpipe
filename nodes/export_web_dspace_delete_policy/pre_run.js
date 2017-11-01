
var base = context.node.params.required_url;
var bundle = context.node.settings.bundle;
var action = context.node.settings.action;
out.console.log("BUNDLE" + bundle)
out.console.log("ACTION " + action)

out.pre_value = [];



// loop over all bitstreams
if(Array.isArray(context.doc[context.node.params.in_bitstream])) {
	context.doc[context.node.params.in_bitstream].forEach(function(bitstream, index) {
		
		// pick corresponding policy array
		if(context.doc[context.node.params.in_bitstream_policy] && context.doc[context.node.params.in_bitstream_policy][index]) {
			var policies = context.doc[context.node.params.in_bitstream_policy][index];
			// looop over policies
			if(Array.isArray(policies)) {
				// in "non-public" mode remove READ policies and copy rest
				policies.forEach(function(policy) {
					if(action === "read" && policy.action === "READ") {
					//out.console.log(bitstream.bundleName.toLowerCase())
						if(policy.resourceId && bitstream.bundleName.toLowerCase() === bundle) {
							var options = {
								url: base + "/bitstreams/" + policy.resourceId + "/policy/" + policy.id,
								method: 'DELETE',
								jar:true
							}
							out.pre_value.push(options);
						}
					}
				})
			} 
		}
	})
}



out.console.log(out.pre_value);


