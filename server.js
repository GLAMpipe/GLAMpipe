
var express			= require('express');
const path			= require('path');
var bodyParser		= require("body-parser");
var GLAMpipe 		= require('./app/glampipe.js');

var GP = new GLAMpipe();
var app = express();
app.use(global.config.uiPath, express.static('public'));
app.set('json spaces', 2); // pretty print
app.use(bodyParser.json({limit: '10mb'}));       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
	extended: true,
	limit: '10mb'
})); 


var http = require('http').Server(app);
		
// web sockets
var io = require('socket.io')(http);

// routes
require('./app/new_routes.js')(app, GP);

http.listen(3000, '127.0.0.1', async () => {
	try {
		await GP.init(http);
		console.log("\n********************* G L A M p i p e RW *************************");
		console.log('listening on port 3000!' + http.address().address)
		console.log("********************* G L A M p i p e RW *************************");
	} catch(e) {
		console.log("GLAMpipe init failed!");
		console.log(e);
	}
})

/*

var server = app.listen(3000, '127.0.0.1', async () => {
	try {
		await GP.init(server);
		console.log("\n********************* G L A M p i p e RW *************************");
		console.log('listening on port 3000!' + server.address().address)
		console.log("********************* G L A M p i p e RW *************************");
	} catch(e) {
		console.log("GLAMpipe init failed!");
		console.log(e);
	}
})
*/
