

context.node.pipe = [
	// download file with _id as filename
	{
		collection: context.node.collection,
		nodeid: "process_download_basic",
		
		// create paramaters
		params: {
			in_field: context.node.params.in_file_url,
			base_url: context.node.params.base_url,
			out_field: context.node.params.in_file_url + "_download",
			out_ext: context.node.params.in_file_url + "_ext",
			out_mime: context.node.params.in_file_url + "_mime"
		}, 
		
		// run settings 
		settings: {
			filename_type: "id",
			extension: "yes"
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
		settings: {}
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
		settings: {}
	},
	
	// upload to commons
	{
		collection: context.node.collection,
		nodeid: "export_web_commons_file",
		params: {
			in_title: context.node.params.in_title,
			in_wikitext: context.node.params.in_wikitext,
			in_location: context.node.params.in_file_url + "_download",
			in_checksum_result: context.node.params.in_file_url + "_checksum",
			out_field: context.node.params.out_field
		},
		// this passes settings from metanode to subnode
		settingsFunc: function() {
			this.settings = {
				server:"0",
				username: context.node.settings.username,
				password: context.node.settings.password
			}
		}
	}
]
