

context.node.metaparams = [
	{
		collection: context.node.collection,
		nodeid: "process_field_split",
		params: {
			in_field: context.node.params.in_field,
			out_field:"meta1_split"
		}
		// settings comes from metanode
	},
	
	{
		collection: context.node.collection,
		nodeid: "process_field_count_chars",
		params: {
			in_field:"meta1_split",
			out_field:context.node.params.out_field
		},
		settings: {
			
		}
	}
]
