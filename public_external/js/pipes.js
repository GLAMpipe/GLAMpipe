
var pipes = {
	
	"import": {
		// create project
		"title":"import",

		collections: [

			// add collection for initial data
			{
				"nodeid": "collection_basic",
				"title": "kokoelma",
				"nodes": [
					// fetch data from dspace 
					{
						"nodeid": "source_api_dspace",
						"params": {
							"dspace_url": "http://siljo.lib.jyu.fi:8080/rest"
						},
						"settings": {
							"dspace_handle": "c00c91f5-4dc2-4c77-9ba1-c0d24cd7eff3",
							"metadata": "on"
						}
					}			
				]
			}
		]
	},	
	
	
	
	"import_and_group_subjects_and authors": {
		// create project
		"title":"que_authors_subjects_lang",

		collections: [

			// add collection for initial data
			{
				"nodeid": "collection_basic",
				"title": "kokoelma",
				"nodes": [
					// fetch data from dspace 
					{
						"nodeid": "source_api_dspace",
						"params": {
							"dspace_url": "http://siljo.lib.jyu.fi:8080/rest"
						},
						"settings": {
							"dspace_handle": "c00c91f5-4dc2-4c77-9ba1-c0d24cd7eff3",
							"metadata": "on"
						}
					}			
				]
			},
			// add collection for authors
			{
				"nodeid": "collection_basic",
				"title": "authors",
				"nodes": [
					// fetch grouped authors from collection "kokoelma"
					{
						"nodeid": "source_group",
						"params": {
							"in_field": "dc_creator",
							"source_collection": "kokoelma",
						},
						"settings": {}
					}			
				]
			},

			// add collection for subjects
			{
				"nodeid": "collection_basic",
				"title": "subjects",
				"nodes": [
					// fetch grouped authors from collection "kokoelma"
					{
						"nodeid": "source_group",
						"params": {
							"in_field": "dc_subject",
							"source_collection": "kokoelma",
						},
						"settings": {}
					}			
				]
			}
			
		]
	},	


	"import_and_detect_abstract_language": {
		// create project
		"title":"que_authors_subjects_lang",

		collections: [

			// add collection for initial data
			{
				"nodeid": "collection_basic",
				"title": "kokoelma",
				"nodes": [
					// fetch data from dspace 
					{
						"nodeid": "source_api_dspace",
						"params": {
							"dspace_url": "http://siljo.lib.jyu.fi:8080/rest"
						},
						"settings": {
							"dspace_handle": "c00c91f5-4dc2-4c77-9ba1-c0d24cd7eff3",
							"metadata": "on"
						}
					},
					// detect language from abstracts
					{
						"nodeid": "process_field_detect_language",
						"params": {
							"in_field": "dc_description",
							"suffix": "_detected_lang"
						},
						"settings": {
							"dspace_handle": "c00c91f5-4dc2-4c77-9ba1-c0d24cd7eff3",
							"metadata": "on"
						}
					}			
				]
			}
			
		]
	}	
	

}


