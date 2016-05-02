
const fs			= require('fs');
const path			= require('path');
const contentTypes	= require('./utils/content-types');
const sysInfo		= require('./utils/sys-info');
const env			= process.env;

var express			= require('express');
var request			= require('request');
var bodyParser		= require("body-parser");
var colors 			= require('ansicolors');

var config 		= require("./config/config.js");


var GlamPipe = function() {

	//  Scope.
	var self = this;


	/*  ================================================================  */
	/*  Helper functions.                                                 */
	/*  ================================================================  */

	/**
	 *  Set up server IP address and port # using env variables/defaults.
	 */
	self.setupVariables = function() {
		//  Set the environment variables we need.
		self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
		self.port      = process.env.OPENSHIFT_NODEJS_PORT || 3000;

		if (typeof self.ipaddress === "undefined") {
			//  Log errors on OpenShift but continue w/ 127.0.0.1 - this
			//  allows us to run/test the app locally.
			console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
			self.ipaddress = "127.0.0.1";
		};
	};




	/**
	 *  Initialize the server (express) and create the routes and register
	 *  the handlers.
	 */
	self.initializeServer = function() {
		
		console.log("initializing server");
		
		self.metapipe 	= require("./app/core.js");

		self.app = express();
		self.app.use(express.static('public'));
		self.app.use( bodyParser.json() );       // to support JSON-encoded bodies
		self.app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
			extended: true
		})); 
		
		self.http 		= require('http').Server(self.app);
		self.io 		= require('socket.io')(self.http);

		require('./app/routes.js')(self.app, self.metapipe, self.io);

	};


	/**
	 *  terminator === the termination handler
	 *  Terminate server on receipt of the specified signal.
	 *  @param {string} sig  Signal to terminate on.
	 */
	self.terminator = function(sig){
		if (typeof sig === "string") {
		   console.log('%s: Received %s - terminating sample app ...',
					   Date(Date.now()), sig);
			self.io.sockets.emit("error", "GLAMpipe server was shut down!!");
		   process.exit(1);
		}
		console.log('%s: Node server stopped.', Date(Date.now()) );
	};


	/**
	 *  Setup termination handlers (for exit and a list of signals).
	 */
	self.setupTerminationHandlers = function(){
		//  Process on exit and signals.
		process.on('exit', function() { self.terminator(); });

		// Removed 'SIGPIPE' from the list - bugz 852598.
		['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
		 'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
		].forEach(function(element, index, array) {
			process.on(element, function() { self.terminator(element); });
		});
	};

	/**
	 *  Initializes the sample application.
	 */
	self.initialize = function(cb) {
		self.setupVariables();
		//self.populateCache();
		//self.setupTerminationHandlers();

		// Create the express server and routes.
		self.initializeServer();

		self.metapipe.initDB(function () {
			self.metapipe.initNodes(function() {
				self.metapipe.initDir(function() {
					
					console.log("INIT done");
					cb();

				});
			});
		});
	};



	/**
	 *  Start the server (starts up the sample application).
	 */
	self.start = function() {
		
		console.log('starting GLAMpipe!');
		console.log("http:", typeof self.http);
		self.http.on("error", function(e) {
			console.log(e);
		});

		//  Start the app on the specific interface (and port).
			var server = self.http.listen(self.port, self.ipaddress, function() {
				var host = server.address().address;
				var port = server.address().port;
				console.log("DATA PATH:",config.dataPath());
				console.log("PROJECTS PATH:",config.projectsDir());
				console.log('GLAMpipe running!');
				console.log('copy this to your web browser -> http://%s:%s', host, port);
			});
	};

}

var glampipe = new GlamPipe();
glampipe.initialize(function() {
	glampipe.start();
});

