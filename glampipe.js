
const fs			= require('fs');
const path			= require('path');
const env			= process.env;
const passport      = require('passport'); 
const LocalStrategy = require('passport-local').Strategy

var express			= require('express');
var request			= require('request');
var bodyParser		= require("body-parser");
var colors 			= require('ansicolors');


global.config = {};



var GlamPipe = function() {

	//  Scope.
	var self = this;

	// TODO: this is bad, fix with npm install ssl-root-cas
	process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

	/*  ================================================================  */
	/*  Helper functions.                                                 */
	/*  ================================================================  */

	/**
	 *  Set up server IP address and port # using env variables/defaults.
	 */
	self.setupVariables = function() {
		// assume that we are running in OpenShift
		//  Set the environment variables we need.
		self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
		self.port      = process.env.OPENSHIFT_NODEJS_PORT || 3000;

		// if we are not in OpenShift, then check if we are inside Docker
		if (typeof self.ipaddress === "undefined") {
			// There should be MONGO env variables present if we were running inside docker
			if(process.env.MONGO_PORT || process.env.DOCKER) {
				console.log("Think I'm running in Docker, using 0.0.0.0");
				self.ipaddress = "0.0.0.0";
				self.dataPath = "/glampipe";
			} else {
				console.log("Running locally, using 127.0.0.1");
				self.ipaddress = "127.0.0.0";
			}
		};

	};




	/**
	 *  Initialize the server (express) and create the routes and register
	 *  the handlers.
	 */
	self.initializeServer = function() {
		
		console.log("initializing server");

		self.app = express();
		self.app.use(express.static('public'));
		self.app.use( bodyParser.json() );       // to support JSON-encoded bodies
		self.app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
			extended: true
		})); 

		self.app.use(passport.initialize()); 


		const user = {  
			username: 'testi',
			password: 'testi',
			id: 1
		}

		passport.use(new LocalStrategy(  
		  function(username, password, done) {
			findUser(username, function (err, user) {
				console.log(username);
				
				if (err) {
					return done(err)
				}
				if (!user) {
					return done(null, false)
				}
				if (password !== user.password  ) {
					return done(null, false)
				}
					return done(null, user)
			})
		  }
		))

		function findUser (username, cb) {
			cb(null,user);
			
		}
		self.passport = passport;

		self.http 		= require('http').Server(self.app);
		self.io 		= require('socket.io')(self.http);

		require('./app/routes.js')(self.app, self, passport);

	};


	/**
	 *  terminator === the termination handler
	 *  Terminate server on receipt of the specified signal.
	 *  @param {string} sig  Signal to terminate on.
	 */
	self.terminator = function(sig){
		if (typeof sig === "string") {
			console.log('%s: Received %s - terminating sample app ...', Date(Date.now()), sig);
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
	 *  Initializes the application.
	 * - check data path
	 * - if data path ok, download nodes
	 * - if nodes ok, initialize server
	 */
	self.initialize = function(cb) {
		self.setupVariables();
		//self.populateCache();
		//self.setupTerminationHandlers();
		
		self.core 	= require("./app/core.js");
	   
		self.core.initDB(function () {
			self.core.createProjectsDir(self.dataPath, function(error) {
		
				if(error) {
					console.log(colors.red("DATAPATH not set"));
					global.config.projectsPath = path.join(self.dataPath, "projects");
					cb("ERROR");
				} else {
					global.config.dataPath = self.dataPath;
					global.config.projectsPath = path.join(self.dataPath, "projects");

					// Create the express server and routes.
					self.initializeServer();
					console.log("INIT done");
					cb(); 

				}
			});
		});

	};



	/**
	 *  Start the server.
	 */
	self.start = function() {
		
		console.log('starting GLAMpipe!');
		self.http.on("error", function(e) {
			console.log(e);
		});

	   // process.on('uncaughtException', function(err) {
			// handle the error safely
		 //   console.log(err)
		//})

		//  Start the app on the specific interface (and port).
			var server = self.http.listen(self.port, self.ipaddress, function() {
				var host = server.address().address;
				var port = server.address().port;
				//console.log("DATA PATH:",config.dataPath());
				//console.log("PROJECTS PATH:",config.projectsDir());
				console.log('GLAMpipe running!');
				console.log('copy this to your web browser -> http://%s:%s', host, port);
			});
	};

}


	
var glampipe = new GlamPipe();


try {
	 
	glampipe.initialize(function(error) {
		if(error)
			console.log("could not start GLAMpipe!");
		else
			glampipe.start();
	});
	
} catch (e) {
		console.log(e);
	}

