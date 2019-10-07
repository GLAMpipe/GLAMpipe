

var GLAMpipe = require('../app/glampipe.js');
var GP = new GLAMpipe();

main();



async function main() {
	var project 	= await GP.createEmptyProject('My new project');
	var collection 	= await GP.createCollection('My data', project._id);
	
	var doc1 = {'title': 'Book of all failures of mankind', 'author': 'Mr. Negative'};
	var doc2 = {'title': 'When things go wrong', 'author': 'Mr. Negative', 'year': '1971'};
	
	await GP.insertDoc(collection.collection, doc1);
	await GP.insertDoc(collection.collection, doc2);
	
	await GP.createSchema(collection.collection);
	console.log(GP.getProjectLink(project._id))
	
	GP.closeDB();
}
