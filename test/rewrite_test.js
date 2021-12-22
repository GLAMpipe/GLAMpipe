

var GLAMpipe = require('../app/glampipe.js');

var GP = new GLAMpipe();

(async () => {
	await GP.init()
	//await FINNAImport();
	//DSpaceImport2()
	var project = await GP.createEmptyProject('GP-Library test');
	var collection 	= await GP.createCollection('My Data', project._id);
	GP.closeDB();
})()


//FINNAImport();
//DSpaceImport2();
//Projects();


//DSpaceImport();


async function FINNAImport() {

	var FinnaProject = {
		project_title: "Finna import",
		collection_title: "my finna",
		nodes: [
			{
				nodeid: "source_web_finna",
				params: {},
				settings: {
					limit: 2,
					license: null,
					raw: false,
					search: "https://finna.fi/Search/Results?limit=0&filter%5B%5D=free_online_boolean%3A%221%22&filter%5B%5D=~format%3A%221%2FImage%2FImage%2F%22&lookfor=tuhkala&type=AllFields"
				}
			}
		]
	}

	var project = await GP.createProject(FinnaProject);

	GP.closeDB();


}


async function DSpaceImport2() {

	var project_title = "eka testi";
	var collection_title = "my collection";
	var import_params = {'required_dspace_url': "https://jyx-beta.jyu.fi/rest"}
	var settings = {
		'query_field[]': '',
		'query_op[]': 'equals',
		'query_val[]': '',
		'mode': 'clear',
		'update_key': 'uuid',
		'limit': '',
		'query': '?collSel[]=5789e99c-23ee-4bb1-bf29-8bdaef9a250a&expand=parentCollection,metadata,bitstreams'
	}


	var project 	= await GP.createEmptyProject(project_title);
	var collection 	= await GP.createCollectionNode(collection_title, project);
	var importNode 	= await GP.createNode("source_web_dspace", import_params, collection.collection, project);

	//await importNode.run(settings);

	GP.closeDB();
}


async function Projects() {

	// list projects
	var projects = await GP.getProjects();
	console.log(projects);
	GP.closeDB();

}







async function DSpaceImport() {
	try {
		var p = await project.create('DSpace import');
		var collection_name = await createCollection("Minun kokoelma", p);

		var import_params = {'required_dspace_url': "https://jyx-beta.jyu.fi/rest"}
		var importNode = await createNode("source_web_dspace", import_params, collection_name, p);

		var settings = {
			'query_field[]': '',
			'query_op[]': 'equals',
			'query_val[]': '',
			'mode': 'clear',
			'update_key': 'uuid',
			'limit': '',
			'query': '?collSel[]=5789e99c-23ee-4bb1-bf29-8bdaef9a250a&expand=parentCollection,metadata,bitstreams'
		}
		await importNode.run(settings);

	} catch(e) {
		console.log(e);
	}
}






async function createCollection(title, project) {

	var collection_name = project.prefix + "_col";
	// collection node
	try {
		var collectionNode = new Node();
		await collectionNode.loadFromRepository("collection_basic");
		await collectionNode.setParams({"title": title})
		await collectionNode.add2Project(project._id, collection_name);
		return collection_name;
	} catch(e) {
		console.log("Collection creation failed!", e)
	}

}

async function createNode(nodeid, params, collection, project) {

			var node = new Node();
			await node.loadFromRepository(nodeid);

			//importNode.setCollection(collectionname);
			await node.setParams(params)
			await node.add2Project(project._id, collection);
			return node;

}

async function importData(collectionName) {

		//console.log('reading stats')
		//var stats = await collection.stats();
		//console.log('*********************')
		//console.log(stats);

		// collection node
		try {
			var collectionNode = new Node();
			await collectionNode.loadFromRepository("collection_basic");
			await collectionNode.setParams({"title": "My collection"})
			await collectionNode.add2Project(p._id, collectionname);

			var collection = db.collection(collectionname);
			//await collection.insert({'field1': 'testi1','author': 'Matti Kyllönen'});


			console.log("inserting data...");
			//for(var i = 0; i < 500 ; i++) {
				//console.log()
				//await collection.insert({'field1': 'testi','author': 'Ari Häyrinen_ ' +i});
			//}
			console.log("inserting data done!");


			// DSpace import node
			var importNode = new Node();
			await importNode.loadFromRepository("source_web_dspace");

			//importNode.setCollection(collectionname);
			await importNode.setParams({'required_dspace_url': "https://jyx-beta.jyu.fi/rest"})
			await importNode.add2Project(p._id, collectionname);

			var settings = {
				'query_field[]': '',
				'query_op[]': 'equals',
				'query_val[]': '',
				'mode': 'clear',
				'update_key': 'uuid',
				'limit': '',
				'query': '?collSel[]=5789e99c-23ee-4bb1-bf29-8bdaef9a250a&expand=parentCollection,metadata,bitstreams'
			}
			await importNode.run(settings);


		/*
			// replace node
			var replaceNode = new Node();
			await replaceNode.loadFromRepository("process_field_replace");

			//replaceNode.setCollection(collectionname);
			await replaceNode.setParams({"in_field": "author", "out_field": "replaced"})
			await replaceNode.add2Project(p._id, collectionname);

			var settings = {"search": ['0'], "replace": ["koira"]}
			await replaceNode.run(settings);
			*/
			//replaceNode.setParams();
			//console.log(replaceNode.getParams());
			//replaceNode.setSettings();

			//await project.remove(p._id)

		} catch(e) {
			console.log(e)
		}

}










function promise_test() {
	return new Promise(function (resolve, reject) {
		collection.find({}, function (err, result) {
			resolve();
		});
	})
}
