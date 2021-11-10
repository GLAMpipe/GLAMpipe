// example of using GLAMpipe as a Library
// Note that this uses same settings and same database than regular install
var GLAMpipe = require('./app/glampipe.js');

var GP = new GLAMpipe();

(async () => {
	await GP.init()
	var project = await GP.createEmptyProject('GP-Library test- negative books');
	var collection 	= await GP.createCollection('My Data', project._id);

	var doc1 = {'title': 'Book of all failures of mankind', 'author': 'Mr. Negative'};
	var doc2 = {'title': 'When things go wrong', 'author': 'Mr. Negative', 'year': '1971'};

	await GP.insertDoc(collection.id, doc1);
	await GP.insertDoc(collection.id, doc2);

	await GP.createSchema(collection.id); // Make sure that UI can show all fields
	await GP.setUserCollectionFields(collection.id, ['title', 'year']) // set "title" and "year" as visible fields in UI
	GP.closeDB();
})()
