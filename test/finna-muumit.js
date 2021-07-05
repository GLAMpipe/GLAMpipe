var GLAMpipe = require('../app/glampipe.js');

var GP = new GLAMpipe();
(async () => {
	await GP.init()
	FINNAImport();
})()


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
					search: "https://finna.fi/Search/Results?limit=0&lookfor=muumit&type=AllFields&filter%5B%5D=~format_ext_str_mv%3A1%2FImage%2FPhoto%2F"
				}
			}
		]
	}
	
	var project = await GP.createEmptyProject("Muumit testissä 2");
	var collection = await GP.createCollection("mydata", project._id);
	console.log(project)
	console.log(collection)
	var node = await GP.createNode("source_web_finna", {}, collection.id, project._id);

	GP.closeDB();
}
	
