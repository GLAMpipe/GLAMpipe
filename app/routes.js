var proxy 	= require("../app/proxy.js");
var collection = require("../app/collection.js");

module.exports = function(express, glampipe, passport) {
    
	var multer 		= require("multer");
	var path 		= require('path');
    var p           = path.join(glampipe.dataPath, 'tmp');  // dataPath is "fakedir" if not set settings.
                                                            // 		This allows us to start everything normally
	var upload 		= multer({ dest: p });

    // INFO to console
	express.all("*", function (req, res, next) {
		console.log(req.method, req.url);
        next();
	});


	var isAuthenticated = function (req, res, next) {
		console.log("CHEKCIN");
	  if (req.isAuthenticated())
		return next();
	  res.redirect('/');
	}

	// TÄLLÄ SUOJATAAN ROUTE !!!!!
	express.post('/login', passport.authenticate('local', { session: false }), function(req, res) {
		// If this function gets called, authentication was successful.
		// `req.user` contains the authenticated user.
		console.log("logged in", req.user.username)
		//res.redirect('/users/' + req.user.username);
	  });

    // SETUP AND STATUS
	express.get('/status', function (req, res) {
        if(glampipe.initError)
            res.json(glampipe.initError);
        else
            res.json({"status":"ok"});
	});

	express.post('/set/datapath', function (req, res) {
		glampipe.core.setDataPath(req.body, glampipe, res);
	});

	express.get('/get/datapath', function (req, res) {
		res.json({"datapath": global.config.dataPath});
	});

	express.post('/download/nodes', function (req, res) {
		glampipe.core.downloadNodes(glampipe.io, function (error) {
            var dataPath = global.config.dataPath;
        // let's try to load nodes
            if(error) {
                glampipe.initError = {"status":"nodepath_error",",msg":"Nodes not found!", "datapath":dataPath};
                res.json({"status": "error"});
            } else {
                glampipe.initError = null;
                res.json({"status": "ok","datapath": dataPath});
            }
        });
	});

	express.post('/read/nodes', function (req, res) {
		glampipe.core.initNodes(glampipe.io, function(error) {
            var dataPath = global.config.dataPath;
        // let's try to load nodes
            if(error) {
                glampipe.initError = {"status":"nodepath_error",",msg":"Nodes not found!", "datapath":dataPath};
                res.json({"status": "error"});
            } else {
                glampipe.initError = null;
                res.json({"status": "ok","datapath": dataPath});
            }
        });
	});




    

	// PROJECTS
	express.get('/', function (req, res) {
		res.sendFile(path.join(__dirname, 'views', 'index.html'));
	});

	express.get('/setup', function (req, res) {
		glampipe.core.sendErrorPage(res, glampipe.initError);
	});

	express.get('/template/:file', function (req, res) {
		res.sendFile(path.join(__dirname, 'templates', 'test.html'));
	});

	express.get('/project/:id', function (req, res) {
		res.sendFile(path.join(__dirname, 'views', 'project.html'));
	});

	express.post('/create/project', function (req, res) {
		glampipe.core.createProject(req.body.title, res);
	});

	express.post('/run/project/:id', function (req, res) {
		glampipe.core.runProject(req, glampipe, res);
	});

	express.get('/get/project/titles', function (req, res) {
		glampipe.core.getProjectTitles(res);
	});

	express.get('/get/projects', function (req, res) {
		glampipe.core.getProjects(res);
	});

	express.get('/get/project/:id', function (req, res) {
		glampipe.core.getProject(req.params.id, res);
	});

	express.post('/delete/project/:id', function (req, res) {
		glampipe.core.deleteProject(req.params.id, res);
	});


	// NODES
	express.get('/get/nodes/:project', function (req, res) {
		glampipe.core.getProjectNodes(req.params.project, res);
	});

	express.get('/get/nodes', function (req, res) {
		glampipe.core.getNodes(res);
	});

	express.get('/get/node/:id', function (req, res) {
		glampipe.core.getNodeFromDir(req.params.id, res);
	});

	express.get('/node/view/:id', function (req, res) {
		glampipe.core.nodeView(req, function(data) {res.send(data)});
	});

	express.get('/node/editview/:id', function (req, res) {
		glampipe.core.nodeEditView(req, function(data) {res.send(data)});
	});

	express.get('/node/fileview/:id', function (req, res) {
		glampipe.core.nodeFileView(req, function(data) {res.send(data)});
	});

	express.get('/node/log/:id', function (req, res) {
		glampipe.core.getNodeLog(req, function(data) {res.send(data)});
	});

	express.get('/node/params/:nodeid', function (req, res) {
		glampipe.core.getNodeParams(req, function(data) {res.send(data)});
	});

	express.post('/node/params/add/:nodeid', function (req, res) {
		glampipe.core.setNodeParams(req, function(data) {res.send(data)});
	});

	express.post('/create/node', function (req, res) {
		glampipe.core.createNode(req.body, res, glampipe.io);
	});

	express.post('/create/collection/node', function (req, res) {
		glampipe.core.createCollectionNode(req.body, res, glampipe.io);
	});

	express.post('/delete/node', function (req, res) {
		glampipe.core.deleteNode(req.body, res, glampipe.io);
	});

	express.post('/set/node/:id/visible-fields', function (req, res) {
		glampipe.core.setVisibleFields(req.params.id, res);
	});

	express.post('/start/node/:id', function (req, res) {
		glampipe.core.runNode(req, glampipe.io);
		res.json({status:"started", ts:  new Date()});
	});

	express.post('/run/node/:id', function (req, res) {
		glampipe.core.runNode(req, glampipe.io, res);
	});


	// DATA
	express.get('/get/collection/:id', function (req, res) {
		glampipe.core.getCollectionTableData(req, res);
	});

	express.get('/get/collection/:id/search', function (req, res) {
		glampipe.core.collectionSearch(req, res);
	});

	express.get('/get/collection/:id/doc/:doc', function (req, res) {
		glampipe.core.getDocumentById(req, res);
	});

	express.get('/get/collection/byfield/:id', function (req, res) {
		glampipe.core.getCollectionByField(req, res);
	});

	express.get('/view/collection/:id', function (req, res) {
		glampipe.core.viewCollection(req.params.id, function(data) {res.send(data)});
	});

	express.get('/get/collection/:name/fields', function (req, res) {
		collection.getKeys(req.params.name, function(data) {res.send(data)});
	});

	express.get('/get/collection/docs/search', function (req, res) {
		// IMPLEMENT ME
		collection.collectionSearch(req, function(data) {res.send(data)});
	});

	express.get('/get/collection/count/:id', function (req, res) {
		glampipe.core.getCollectionCount(req, function(data) {res.send(data)});
	});

	express.get('/get/collection/:id/facet/test', function (req, res) {
		glampipe.core.getCollectionFacetTest(req, function(data) {res.send(data)});
	});

	express.get('/get/collection/:id/facet/:field', function (req, res) {
		glampipe.core.getCollectionFacet(req, function(data) {res.send(data)});
	});

	express.get('/get/collection/:id/facet/:field/groupby/:groupby', function (req, res) {
		glampipe.core.getCollectionFacetGroupBy(req, function(data) {res.send(data)});
	});

	express.get('/get/collection/:id/facet/:field/groupby/:group', function (req, res) {
		glampipe.core.getCollectionFacetGroupBy(req, function(data) {res.send(data)});
	});



	express.post('/edit/collection/:id', function (req, res) {
		glampipe.core.editCollection(req.params.id, req, function(data) {res.send(data)});
	});

	express.post('/edit/collection/addtoset/:id', function (req, res) {
		glampipe.core.editCollectionAddToSet(req.params.id, req, function(data) {res.send(data)});
	});


	// USERS
	express.post('/add/user', function (req, res) {
		glampipe.core.addUser(req, function(data) {res.send(data)});
	});


	// UPLOAD
	express.post('/upload/file', upload.single('file'), function (req, res) {
		glampipe.core.uploadFile(req, res);
	});


    // DOWNLOAD
	express.get('/export/:projectdir/:nodedir/:file', function (req, res) {
		res.sendFile(path.join(glampipe.dataPath, "projects", req.params.projectdir, 'export', req.params.nodedir, req.params.file));
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
	express.get('/proxy/', function (req, res) {
		proxy.proxyJSON(req.query.url, req.query.query, res);
	});

	express.post('/proxy/', function (req, res) {
		proxy.proxyJSON(req.body.url, req.body.query, res);
	});
    
}
