
var express 	= require("express");
var bodyParser	= require("body-parser");
var metapipe 	= require("./app/core.js");

var app 		= express();

app.use(express.static('public'));
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

// load stock nodes ===================================================
metapipe.initNodes();
metapipe.initDB();

// routes =============================================================
require('./app/routes.js')(app, metapipe);


var server = app.listen(3000, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log('listening at http://%s:%s', host, port);
});

console.log('metapipe server started');




