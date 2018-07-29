var db 	= require('./db.js');
var project 	= require('./new_project.js');
var Node 	= require('./new_node.js');

const mongoist = require('mongoist');





async function data() {
	
		//console.log('reading stats')
		//var stats = await collection.stats();
		//console.log('*********************')
		//console.log(stats);

		
		//var insert1 = await collection.insert({'field1': 'testi','author': 'Ari Häyrinen'});
		//var insert1 = await collection.insert({'field1': 'testi','author': 'Ari Häyrinen'});
		//var result2 = await collection.find({});
		//console.log(result2)
		
		//var p = await project.create('uusi');
		var p = await project.create('resti_uusi');
		console.log(p);
		

		var collectionname = p.prefix + "_col";
		//await db.createCollection(collectionname);
		//var collection = db.collection(collectionname);
		
		//await db.collection("mp_projects").update({_id:mongoist.ObjectId(p.uuid)}, {$inc: { collection_count: 1, node_count: 1}, $addToSet: {collections: [collectionname] } });

		//for(var i = 0; i < 5 ; i++) {
			//console.log()
			//var insert = await collection.insert({'field1': 'testi','author': 'Ari Häyrinen ' +i});
		//}
		
		//var insert1 = await collection.insert({'field1': 'testi2','author': 'Matti Kyllönen'});
		
		// collection node
		try {
			var collectionNode = new Node();
			await collectionNode.loadFromRepository("collection_basic");
			await collectionNode.setParams({"title": "My collection"})
			await collectionNode.add2Project(p._id, collectionname);
			
			var collection = db.collection(collectionname);
			await collection.insert({'field1': 'testi1','author': 'Matti Kyllönen'});
			await collection.insert({'field1': 'testi2','author': 'Kari Kyllönen'});
				
		
			// replace node
			var replaceNode = new Node();
			await replaceNode.loadFromRepository("process_field_replace");
			
			//replaceNode.setCollection(collectionname);
			await replaceNode.setParams({"in_field": "author", "out_field": "replaced"})
			await replaceNode.add2Project(p._id, collectionname);
			
			var settings = {"search": ['0'], "replace": ["koira"]}
			await replaceNode.run(settings);
			
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




data();
//data().catch(console.log('rrrrrr'));

/*
new Project(title)
project.save()
project.addCollection(collection)
project.getCollection(collection_id)
* */
