
var base = context.node.params.required_url;
var action = "READ";


out.pre_value = [];


// first we must delete all OLD policies 
if(Array.isArray(context.doc[context.node.params.in_bitstream_policy_old])) {
	
	var old_policies = context.doc[context.node.params.in_bitstream_policy_old];
	
	// loop through OLD policies per bitstream for deletion
	old_policies.forEach(function(policyArr, index) {
		
		out.pre_value[index] = [];
		// loop through OLD policies for removal
		if(Array.isArray(policyArr)) {
			policyArr.forEach(function(policy) {

				if(policy.resourceId && policy.id) {
					options = {
						url: base + "/bitstreams/" + policy.resourceId + "/policy/" + policy.id,
						method: 'DELETE',
						jar:true
					}
					out.pre_value[index].push(options);
				}
			})
		}
	})
}
	
// [0]
//		[0] delete
// [1]
//		[0] 

if(Array.isArray(context.doc[context.node.params.in_bitstream_policy_new])) {
	var new_policies = context.doc[context.node.params.in_bitstream_policy_new];

	// loop through NEW policies per bitstream for creation
	new_policies.forEach(function(policyArr, index) {

		// loop through NEW policies 
		if(Array.isArray(policyArr)) {
			policyArr.forEach(function(policy) {

				if(policy.resourceId) {
					options = {
						url: base + "/bitstreams/" + policy.resourceId + "/policy",
						method: 'POST',
						json: policy,
						jar:true
					}
					out.pre_value[index].push(options);
				}
			})
		}

	})
}

out.console.log(out.pre_value);


