

context.node.pipe = [
	// download file with _id as filename
	{
		collection: context.node.collection,
		nodeid: "process_download_basic",
		
		// create paramaters
		params: {
			in_field: context.node.params.in_file_url,
			base_url: context.node.params.base_url,
			out_field: context.node.params.in_file_url + "_download"
		}, 
		
		// run settings 
		settings: {
			filename_type: "id"
		}
	},
	
	// calculate checksum for file
	{
		collection: context.node.collection,
		nodeid: "process_file_calculate_checksum",
		params: {
			in_field: context.node.params.in_file_url + "_download",
			out_field: context.node.params.in_file_url + "_checksum"
		},
		settings: {
			
		}
	},
	
	// check if file is in commons
	{
		collection: context.node.collection,
		nodeid: "process_lookup_web_check_commons",
		params: {
			in_field: context.node.params.in_file_url + "_checksum",
			out_field: context.node.params.out_field,
			server: "beta"
		},
		settings: {
			
		}
	},
]
