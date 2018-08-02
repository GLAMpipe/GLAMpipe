

var GLAMpipe = require('../app/glampipe.js');

var collection = 'p396_finna_import_c0_myfinna';
var GP = new GLAMpipe();

search(collection)


async function search(collection_name) {
	

	var params = {
		'keys': 'title, year',
		'limit': 10
	}
	var docs = await GP.getDocs(collection_name, params);
	console.log(docs);
	
	GP.closeDB();


}
	








