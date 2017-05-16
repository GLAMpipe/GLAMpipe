
var jwt			= require('jsonwebtoken');
var jwt2		= require('express-jwt');
var proxy 		= require("../app/proxy.js");
var collection 	= require("../app/collection.js");
var project 	= require("../app/project.js");
//var User 		= require("../app/controllers/user.js");
const conf 		= require("../config/config.js");

module.exports = function(express, glampipe, passport) {
    
	var multer 		= require("multer");
	var path 		= require('path');
    var p           = path.join(glampipe.dataPath, 'tmp');  // dataPath is "fakedir" if not set settings.
                                                            // 		This allows us to start everything normally
	var upload 		= multer({ dest: p });
	express.set('superSecret', conf.secret); // secret variable
	
    // print all request to console, could use morgan?
	express.all("*", function (req, res, next) {
		console.log(req.method, req.url);
        next();
	});

	// make login api open
	var openPOSTRoutes = ["/api/v1/login"];

	// authentication checker 
	var isLoggedInAPI = function (req, res, next) {
		
		// check and set ip in case we are behind proxy
		var ip = req.ip;
		if(req.headers['x-real-ip'])
			ip = req.headers['x-real-ip']

		var pass = false;
		conf.IP_passes.some(function(IP_pass) {
			if(req.path.includes(IP_pass.path) && req.method === IP_pass.method && ip === IP_pass.ip) {
				pass = true;
				console.log("INFO: allowed by IP_pass: " + IP_pass.label)
			}
		})
		
		if(pass)
			return next();


		// open some POST routes
		if(openPOSTRoutes.includes(req.path)) return next();
		//GET routes are all open
		if(req.method === "GET" && req.path !== "/api/v1/auth") return next();
		if (req.isAuthenticated())
			return next();
			
		res.json({error:"not authenticated!"});
	}

	
	// API AUTH
	express.post('/api/v1/login', passport.authenticate('local-login', { session: false }), function(req, res) {
		console.log("logged in", req.user.id)
		var token = jwt.sign(req.user, express.get('superSecret'), {
			expiresIn: 86400 // expires in 24 hours
		});

		res.json({
			success: true,
			message: 'Enjoy your token!',
			token: token,
			user: req.user
		});
	});


	// protect API routes
	if(config.isServerInstallation) {
		var s = express.get('superSecret');
		express.post('/api/v1/*', jwt2({secret: s}));
		express.put('/api/v1/*', jwt2({secret: s}));
		express.delete('/api/v1/*', jwt2({secret: s}));
        
        // projects
        express.all('/api/v1/projects/:project/*', function(req, res, next) {
            if(req.method === "GET")
                next();
            else {
                project.isAuthenticated(req, function(authenticated) {
                    if(authenticated)
                        next();
                    else
                        res.json({error:"not authenticated!"});
                })
            }
        })
        
        // node run
        express.post('/api/v1/nodes/:id/*', function(req, res, next) {

            project.isAuthenticated(req, function(authenticated) {
                if(authenticated)
                    next();
                else
                    res.json({error:"not authenticated!"});
            })
        })
    }


/***************************************************************************************************************
 *                                       VIEWS                                                               *
 * *************************************************************************************************************/

	// main page
	express.get('/', function (req, res) {
		res.sendFile(path.join(__dirname, 'views', 'index.html'));
	});

	// setup page
	express.get('/setup', function (req, res) {
		glampipe.core.sendErrorPage(res, glampipe.initError);
	});

	// project page
	express.get('/project/:id', function (req, res) {
		res.sendFile(path.join(__dirname, 'views', 'project.html'));
	});

	// facet view
	express.get('/views/data/facets/:nodeid', function (req, res) {
		var facet = require("../app/node_runners/view-facet.js");
		facet.getFacetIndexHTML(req,res);
		//res.sendFile(path.join(__dirname, 'views', 'dataviews', 'facet.html'));
	});	


/***************************************************************************************************************
 *                                       LOGIN/SIGNUP                                                               *
 * *************************************************************************************************************/

	// login page
	express.get('/signup', function (req, res) {
		if(global.config.isServerInstallation)
			res.sendFile(path.join(__dirname, 'views', 'login.html'));
		else
			res.redirect('/');
	});

	// signup handler
	express.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/',
		failureRedirect : '/login'
	
	}));	
	
	
/***************************************************************************************************************
 *                                       API                                                              *
 * *************************************************************************************************************/



    // SETUP AND STATUS
	express.get('/api/v1/config', function (req, res) {
		res.json({
			url:conf.url, 
			isServerInstallation:conf.isServerInstallation, 
			version:conf.version,
			dataPath:conf.dataPath
		});
	});
    
	express.get('/api/v1/status', function (req, res) {
        if(glampipe.initError)
            res.json(glampipe.initError);
        else
            res.json({"status":"ok"});
	});

	express.post('/api/v1/datapaths', function (req, res) {
		glampipe.core.setDataPath(req.body, glampipe, res);
	});

	express.get('/api/v1/datapaths', function (req, res) {
		res.json({"dataPath": global.config.dataPath});
	});


	// PROJECTS
	express.put('/api/v1/projects', function (req, res) {
		glampipe.core.createProject(req, res);
	});

	//TODO: reimplement this!
	//express.post('/api/v1/projects/:id/run', function (req, res) {
		//glampipe.core.runProject(req, glampipe, res);
	//});

	express.get('/api/v1/projects/titles', function (req, res) {
		glampipe.core.getProjectTitles(res);
	});

	express.get('/api/v1/projects', function (req, res) {
		glampipe.core.getProjects(res);
	});

	express.get('/api/v1/projects/:id', function (req, res) {
		glampipe.core.getProject(req.params.id, res);
	});

	express.delete('/api/v1/projects/:id', function (req, res) {
		glampipe.core.deleteProject(req.params.id, res);
	});


	// NODES
	express.get('/api/v1/projects/:project/nodes', function (req, res) {
		glampipe.core.getProjectNodes(req.params.project, res);
	});

	express.get('/api/v1/nodes', function (req, res) {
		glampipe.core.getNodes(res);
	});

	express.get('/api/v1/nodes/:nodeid', function (req, res) {
		glampipe.core.getNodeFromDir(req.params.id, res);
	});

	//express.get('/node/view/:id', function (req, res) {
		//glampipe.core.nodeView(req, function(data) {res.send(data)});
	//});

	express.get('/api/v1/nodes/:id/log', function (req, res) {
		glampipe.core.getNodeLog(req, function(data) {res.send(data)});
	});

	express.get('/api/v1/nodes/:nodeid/params', function (req, res) {
		glampipe.core.getNodeParams(req, function(data) {res.send(data)});
	});

	express.get('/api/v1/nodes/:nodeid/files/:file', function (req, res) {
		glampipe.core.getNodeFile(req, function(data) {res.send(data)});
	});

	express.post('/api/v1/nodes/:nodeid/params', function (req, res) {
		glampipe.core.setNodeParams(req, function(data) {res.send(data)});
	});

	express.put('/api/v1/projects/:project/nodes/:nodeid', function (req, res) {
		glampipe.core.createNode(req, res, glampipe.io);
	});

	express.delete('/api/v1/projects/:project/nodes/:node', function (req, res) {
		glampipe.core.deleteNode(req, res, glampipe.io);
	});

	//express.post('/set/node/:id/visible-fields', function (req, res) {
		//glampipe.core.setVisibleFields(req.params.id, res);
	//});

	express.post('/api/v1/nodes/:id/start', function (req, res) {
		glampipe.core.runNode(req, glampipe.io);
		res.json({status:"started", ts:  new Date()});
	});

	express.post('/api/v1/nodes/:id/run/:doc', function (req, res) {
		glampipe.core.runNode(req, glampipe.io, res);
	});

	express.post('/api/v1/nodes/:id/run', function (req, res) {
		glampipe.core.runNode(req, glampipe.io, res);
	});


	// DATA
    
    // protect user data
	express.get('/api/v1/collections/mp_users/*', function (req, res) {
		res.send("buu");
	});
    
	express.get('/api/v1/collections/:collection/docs', function (req, res) {
		glampipe.core.getCollectionTableData(req, res);
	});

	express.get('/api/v1/collections/:collection/docs/:doc', function (req, res) {
		glampipe.core.getDocumentById(req, res);
	});

	express.get('/api/v1/collections/:collection/search', function (req, res) {
		glampipe.core.collectionSearch(req, res);
	});

	express.get('/api/v1/collections/:collection/search/byfield', function (req, res) {
		glampipe.core.getCollectionByField(req, res);
	});

	//express.get('/view/collection/:id', function (req, res) {
		//glampipe.core.viewCollection(req.params.id, function(data) {res.send(data)});
	//});

	express.get('/api/v1/collections/:collection/fields', function (req, res) {
		collection.getKeys(req.params.collection, function(data) {res.send(data)});
		//collection.getAllCollectionKeys(req.params.collection, function(data) {res.send(data)});
	});

	express.get('/api/v1/collections/:collection/schema', function (req, res) {
		require("../app/schema.js").getCollectionSchema(req.params.collection, function(data) {res.send(data)})
		//collection.getSchema(req.params.collection, function(data) {res.send(data)});
		//collection.getAllCollectionKeys(req.params.collection, function(data) {res.send(data)});
	});

	express.get('/api/v1/collections/:collection/types', function (req, res) {
		collection.getKeyTypes(req.params.collection, function(data) {res.send(data)});
	});

	//express.get('/get/collection/docs/search', function (req, res) {
		// IMPLEMENT ME
		//collection.collectionSearch(req, function(data) {res.send(data)});
	//});

	express.get('/api/v1/collections/:collection/count/regexp', function (req, res) {
		glampipe.core.getCollectionCountRegExp(req, function(data) {res.send(data)});
	});

	express.get('/api/v1/collections/:collection/count', function (req, res) {
		glampipe.core.getCollectionCount(req, function(data) {res.send(data)});
	});

	//express.get('/get/collection/:id/facet/test', function (req, res) {
		//glampipe.core.getCollectionFacetTest(req, function(data) {res.send(data)});
	//});

	express.get('/api/v1/collections/:collection/facet/:field', function (req, res) {
		glampipe.core.getCollectionFacet(req, function(data) {res.send(data)});
	});

	express.get('/api/v1/collections/:collection/facet/:field/groupby/:groupby', function (req, res) {
		glampipe.core.getCollectionFacet(req, function(data) {res.send(data)});
	});

	express.post('/api/v1/collections/:collection/docs/:doc', function (req, res) {
		glampipe.core.editCollection(req, function(data) {res.send(data)});
	});

	express.put('/api/v1/collections/:collection/docs/:doc', function (req, res) {
		glampipe.core.editCollection2(req, function(data) {res.send(data)});
	});

	express.post('/edit/collection/addtoset/:id', function (req, res) {
		glampipe.core.editCollectionAddToSet(req.params.id, req, function(data) {res.send(data)});
	});

	// UPLOAD
	express.post('/api/v1/upload', upload.single('file'), function (req, res) {
		glampipe.core.uploadFile(req, res);
	});

	express.delete('/api/v1/upload/:id', function (req, res) {
		glampipe.core.deleteFile(req, res);
	});
	
    // DOWNLOAD
	express.get('/export/:projectdir/:nodedir/:file', function (req, res) {
		res.sendFile(path.join(glampipe.dataPath, "projects", req.params.projectdir, 'export', req.params.nodedir, req.params.file));
	});

	express.get('/files/:projectdir/:nodedir/:file', function (req, res) {
		res.sendFile(path.join(glampipe.dataPath, "projects", req.params.projectdir, 'process', req.params.nodedir, req.params.file));
	});

	// PIPES
	express.post('/create/pipe', function (req, res) {
		glampipe.core.createPipe(req, function(data) {res.send(data)});
	});

	// NODE EDITOR
	express.get('/node-viewer', function (req, res) {
		res.sendFile(path.join(__dirname, 'views', 'node-editor.html'));
	});
    
	// PROXY
	express.get('/api/v1/proxy/', function (req, res) {
		proxy.proxyJSON(req.query.url, req.query.query, res);
	});

	express.post('/api/v1/proxy/', function (req, res) {
		proxy.proxyJSON(req.body.url, req.body.query, res);
	});


	express.get('/api/v1/auth', jwt2({secret:express.get("superSecret")}), function (req, res) {
			res.json({user:req.user});
	});


	// express.route("/users").get(User.findAll);



	//express.post('/download/nodes', function (req, res) {
		//glampipe.core.downloadNodes(glampipe.io, function (error) {
            //var dataPath = global.config.dataPath;
        //// let's try to load nodes
            //if(error) {
                //glampipe.initError = {"status":"nodepath_error",",msg":"Nodes not found!", "datapath":dataPath};
                //res.json({"status": "error"});
            //} else {
                //glampipe.initError = null;
                //res.json({"status": "ok","datapath": dataPath});
            //}
        //});
	//});

	//express.post('/read/nodes', function (req, res) {
		//glampipe.core.initNodes(glampipe.io, function(error) {
            //var dataPath = global.config.dataPath;
        //// let's try to load nodes
            //if(error) {
                //glampipe.initError = {"status":"nodepath_error",",msg":"Nodes not found!", "datapath":dataPath};
                //res.json({"status": "error"});
            //} else {
                //glampipe.initError = null;
                //res.json({"status": "ok","datapath": dataPath});
            //}
        //});
	//});


    
}


