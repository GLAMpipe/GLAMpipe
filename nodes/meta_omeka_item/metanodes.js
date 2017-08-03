

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
	
	// upload downloaded file to OMEKA-s
	{
		collection: context.node.collection,
		nodeid: "export_web_omeka_s_addfile",
		params: {
			in_field: context.node.params.in_omeka_id,
			in_file: context.node.params.in_file_url + "_download",
			out_field: "meta1_omekamedia_id"
		},
		settings: {
			
		}
	}
]
