
const fs			= require('fs');
const path			= require('path');
const passport      = require('passport'); 
var express			= require('express');
var session      	= require('express-session');
var request			= require('request');
var bodyParser		= require("body-parser");
var cors 			= require('cors');
var colors 			= require('ansicolors');
const version 		= require("./config/version.js");
const env			= process.env;

try {
	global.config 		= require("./config/config.js");
	global.config.file = "config.js (your local settings)";
} catch(e) {
	console.log("config.js not found or is malformed!");
	global.config 		= require("./config/config.js.example");
	global.config.file = "config.js.example (default settings)";
}


global.config.version = version.version;

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
		self.dataPath = global.config.dataPath;
		
		if(self.dataPath == "")
			self.dataPath = path.join(__dirname, "glampipe-data");
			
		self.nodePath = global.config.nodePath;

		// There should be DOCKER env variable present if we were running inside docker
		if(process.env.DOCKER) {
			console.log("Think I'm running in Docker/Compose, using 0.0.0.0");
			self.ipaddress = "0.0.0.0";
			self.dataPath = "/glampipe-data";
		} else {
			console.log("Running locally, using 127.0.0.1");
			self.ipaddress = "127.0.0.1";
		}
	};




	/**
	 *  Initialize the server (express) and create the routes and register
	 *  the handlers.
	 */
	self.initializeServer = function() {
		
		self.app = express();
		self.app.use(global.config.uiPath, express.static('public'));
		self.app.use("/publicview", express.static('app/views/datapublic'));
		self.app.use(global.config.staticPath, express.static('public_external'));
		self.app.use( bodyParser.json({limit: '10mb'}));       // to support JSON-encoded bodies
		self.app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
			extended: true,
			limit: '10mb'
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

		// LOGGER
		var winston = require('winston');
		require('winston-daily-rotate-file');
		
		var info = new (winston.transports.DailyRotateFile)({
			name:"info",
			filename: self.dataPath + '/logs/log',
			datePattern: 'access_yyyy-MM-dd.',
			prepend: true,
			level: 'info'
		});

		var error = new (winston.transports.DailyRotateFile)({
			name:"error",
			filename: self.dataPath + '/logs/log',
			datePattern: 'error_yyyy-MM-dd.',
			prepend: true,
			level: 'error'
		});

		self.logger = new (winston.Logger)({
			transports: [
			  info, error
			]
		});


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
	 * - if data path ok, load nodes
	 * - if nodes ok, initialize server
	 */
	 
	// TODO: promisify!
	self.initialize = function(cb) {
		self.setupVariables();
		self.core 	= require("./app/core.js");
		var node 	= require("./app/node.js");
		
		self.core.createDirIfNotExist(self.dataPath, function(error, msg) {
			if(error) {
				console.log(colors.red("DATAPATH problem: " + self.dataPath));
				console.log(msg);
				cb(error);
			} else {
			   
				self.core.createDirIfNotExist(path.join(self.dataPath, "logs"), function(error, msg) {
					if(error)
						console.log(msg);
				}) // create logs dir
				self.core.initDB(function (error) {

					node.initNodes (self.nodePath, null, function() {

						self.core.createDirIfNotExist(path.join(self.dataPath, "projects"), function(error, msg) {
					
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
			}
		})


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
			self.logger.error(err);
			// handle the error safely
		    console.log("MAJOR ERROR!")
		    console.log(err)
		    // let's clear node run register so that node can be run again
		    // TODO: we should sent response to node execution request
		    global.register = [];
		})

		//  Start the app on the specific interface (and port).
		var server = self.http.listen(self.port, self.ipaddress, function() {
			var host = server.address().address;
			var port = server.address().port;
			console.log("\n********************* G L A M p i pe *************************");
			console.log("* VERSION :        ", version.version);
			if(process.env.DOCKER)
				console.log("* ENVIRONMENT:      Docker");
			else
				console.log("* ENVIRONMENT:      native Nodejs (non-docker)");
			console.log("* CONFIG FILE:     ", global.config.file);
			console.log("* DATA PATH:       ", self.dataPath);
			console.log("* NODE PATH:       ", self.nodePath);
			console.log("* DATABASE:        ", global.db_string);
			console.log("* AUTHENTICATION   ", global.config.authentication);
			console.log("* STATUS:           running on http://%s:%s", host, port);
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

