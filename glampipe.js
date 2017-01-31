
const fs			= require('fs');
const path			= require('path');
const passport      = require('passport'); 
var express			= require('express');
var session      	= require('express-session');
var request			= require('request');
var bodyParser		= require("body-parser");
var cors 			= require('cors');
var colors 			= require('ansicolors');
global.config 		= require("./config/config.js");
const env			= process.env;



var GlamPipe = function() {

	//  Scope.
	var self = this;

	// TODO: this is bad, fix with npm install ssl-root-cas
	process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

	/**
	 *  Set up server IP address and port 
	 */
	self.setupVariables = function() {

		self.port      = 3000;
		self.nodePath = global.config.nodePath;

		// There should be MONGO env variables present if we were running inside docker
		if(process.env.MONGO_PORT || process.env.DOCKER) {
			console.log("Think I'm running in Docker/Compose, using 0.0.0.0");
			self.ipaddress = "0.0.0.0";
			self.dataPath = "/glampipe";
		} else {
			console.log("Running locally, using 127.0.0.1");
			self.ipaddress = "127.0.0.1";
			self.dataPath = global.config.dataPath;
		}
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

		self.app.set('json spaces', 2); // pretty print

		// CORS
		self.app.use(cors());
		self.app.options('*', cors());

		// USER AUTHENTICATION
		self.app.use(session({
			secret: 'justsomethingvalidhere', // session secret
			resave: true,
			saveUninitialized: true
		}));
		
		require('./config/passport')(passport); // pass passport for configuration
		self.app.use(passport.initialize()); 		
		self.app.use(passport.session()); // persistent login sessions

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
			console.log('%s: Received %s - terminating GLAMpipe ...', Date(Date.now()), sig);
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
		self.core 	= require("./app/core.js");
	   
		self.core.initDB(function (error) {

			self.core.initNodes (self.nodePath, null, function() {

				self.core.createProjectsDir(self.dataPath, function(error, msg) {
			
					if(error) {
						console.log(colors.red("DATAPATH problem: " + self.dataPath));
						console.log(msg);
						cb(error);
					} else {
						global.config.dataPath = self.dataPath;
						global.config.projectsPath = path.join(self.dataPath, "projects");

						// Create the express server and routes.
						self.initializeServer();
						console.log(colors.green("INIT done"));
						cb(); 
					}
				});
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

	    process.on('uncaughtException', function(err) {
			// handle the error safely
		    console.log("MAJOR ERROR!")
		    console.log(err)
		})

		//  Start the app on the specific interface (and port).
			var server = self.http.listen(self.port, self.ipaddress, function() {
				var host = server.address().address;
				var port = server.address().port;
				console.log("\n********************* G L A M p i pe *************************");
				console.log("* DATA PATH:",self.dataPath);
				console.log("* NODE PATH:",self.nodePath);
				console.log("* STATUS:    running on http://%s:%s", host, port);
				console.log("********************* G L A M p i pe *************************");
			});
	};

}


	
var glampipe = new GlamPipe();


try {
	 
	glampipe.initialize(function(error) {
		if(error) {
			console.log(colors.red("Could not start GLAMpipe!"));
			process.exit();
		} else
			glampipe.start();
	});
	
} catch (e) {
		console.log(e);
	}

