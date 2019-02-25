var GLAMpipe = require('../app/glampipe.js');

var GP = new GLAMpipe();
FINNAImport();

async function FINNAImport() {
	
	var FinnaProject = {
		project_title: "Muumit laaksossa",
		collection_title: "images",
		nodes: [
			{
				nodeid: "source_web_finna",
				params: {},
				settings: {
					limit: 2,
					license: null,
					raw: false,
					search: "https://finna.fi/Search/Results?filter%5B%5D=~format_ext_str_mv%3A%221%2FImage%2FImage%2F%22&filter%5B%5D=free_online_boolean%3A1&dfApplied=1&lookfor=muumi&type=AllFields"
				}
			}
		]
	}
	
	var project = await GP.createProject(FinnaProject);
	GP.closeDB();
}
	
