
var config = {
	nodes: {
		csv:{
			id: "source_file_csv",
			params: {
				file: "",
				filename: ""
			},
			settings: {
				separator: ",",
				encoding: "utf8"
			}
		},
		
		map: {
			id: "export_mapping_create_commons_metadata",
			params: {
				template: "0",
				out_field: "wikitext"
			},
			settings: {
				
			}
		}
	}
}
