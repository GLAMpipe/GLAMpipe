
var express 	= require("express");
var bodyParser	= require("body-parser");
var metapipe 	= require("./app/core.js");



var app 		= express();
var http 		= require('http').Server(app);
var io 			= require('socket.io')(http);

app.use(express.static('public'));
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

// init db and load stock nodes ===================================================
metapipe.initDB(function () {
	metapipe.initNodes();
	});

// routes =============================================================
require('./app/routes.js')(app, metapipe, io);


//websocket
io.on("connection", function (socket) {
  socket.emit('news', "Welcome to MetaPipe!" );
});


http.listen(3000);

//var server = app.listen(3000, function () {
	//var host = server.address().address;
	//var port = server.address().port;
	//console.log('listening at http://%s:%s', host, port);
//});

console.log('metapipe server started');




