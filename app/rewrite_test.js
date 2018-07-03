var db 	= require('./db.js');
var project 	= require('./new_project.js');


var collectionname = "p141_great-rewrite_c1_rewrite"
var collection = db.collection(collectionname);

//var db = mongojs(database.initDBConnect());




async function data() {
	
		//console.log('reading stats')
		//var stats = await collection.stats();
		//console.log('*********************')
		//console.log(stats);
		for(var i = 0; i < 5 ; i++) {
			console.log()
			var insert = await collection.insert({'field1': 'testi','author': 'Ari Häyrinen ' +i});
		}
		var insert1 = await collection.insert({'field1': 'testi','author': 'Ari Häyrinen'});
		//var insert1 = await collection.insert({'field1': 'testi','author': 'Ari Häyrinen'});
		//var insert1 = await collection.insert({'field1': 'testi','author': 'Ari Häyrinen'});
		//var result2 = await collection.find({});
		//console.log(result2)
		
		//var p = await project.create('uusi');
		var p = await project.createRest({'body':{'title':'resti_uusi'}}, function(result) {console.log('done')});
		console.log(p)
		

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
