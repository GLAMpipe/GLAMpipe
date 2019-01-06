
var express			= require('express');
const path			= require('path');
var bodyParser		= require("body-parser");
var GLAMpipe 		= require('./app/glampipe.js');

var GP = new GLAMpipe();
var app = express();
app.use(global.config.uiPath, express.static('public'));
app.set('json spaces', 2); // pretty print
app.use( bodyParser.json({limit: '10mb'}));       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
	extended: true,
	limit: '10mb'
})); 

require('./app/new_routes.js')(app, GP);

var server = app.listen(3000, '127.0.0.1', async () => {
	try {
		await GP.init();
		console.log("\n********************* G L A M p i p e RW *************************");
		console.log('listening on port 3000!' + server.address().address)
		console.log("********************* G L A M p i p e RW *************************");
	} catch(e) {
		console.log("GLAMpipe init failed!");
		console.log(e);
	}
})
