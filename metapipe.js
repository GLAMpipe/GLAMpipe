
var express 	= require("express");
var bodyParser	= require("body-parser");
var colors 		= require('ansicolors');
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
console.log(colors.green("INIT:"),  "starting");
metapipe.initDB(function () {
	metapipe.initNodes(function() {
		metapipe.initDir(function() {
			
			console.log("INIT: done");
			
			// routes =============================================================
			require('./app/routes.js')(app, metapipe, io);

			//websocket
			io.on("connection", function (socket) {
			  socket.emit('news', "Welcome to MetaPipe!" );
			});

			// last guard
			//process.on('uncaughtException', function (err) {
			  //console.log('Caught exception: ' + err.name);
			//});

			// we notify browser of control + c
			process.on( 'SIGINT', function() {
				console.log( "\nGot SIGINT (Ctrl-C)" );
				io.sockets.emit("error", "metapipe server was shut down!!");
				process.exit( );
			})

			var server = http.listen(3000, function() {
				var host = server.address().address;
				var port = server.address().port;
				console.log('metapipe running!');
				console.log('copy this to your web browser -> http://%s:%s', host, port);
			});
		});
	});
});






