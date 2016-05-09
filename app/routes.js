

module.exports = function(express, glampipe) {
    
	var multer 		= require("multer");
	var path 		= require('path');
    var p = path.join(glampipe.dataPath, 'tmp');
	var upload 		= multer({ dest: p });

    // INFO to console
	express.all("*", function (req, res, next) {
		console.log(req.method, req.url);
		//console.log(req.params);
        if(glampipe.initError && req.method == "GET") 
            glampipe.core.sendErrorPage(res, glampipe.initError);
        else
            next();
	});

    // SETUP

	express.post('/set/datapath', function (req, res) {
		glampipe.core.setDataPath(req.body, glampipe, res);
	});

	// PROJECTS

	express.get('/', function (req, res) {
		res.sendFile(path.join(__dirname, 'views', 'index.html'));
	});

	express.get('/setup', function (req, res) {
		res.sendFile(path.join(__dirname, 'views', 'setup.html'));
	});

	express.get('/template/:file', function (req, res) {
		res.sendFile(path.join(__dirname, 'templates', 'test.html'));
	});

	express.get('/project/:id', function (req, res) {
		res.sendFile(path.join(__dirname, 'views', 'project_new_ui.html'));
	});

	express.post('/create/project', function (req, res) {
		glampipe.core.createProject(req.body.title, res);
	});

	express.get('/get/projects', function (req, res) {
		glampipe.core.getProjects(res);
	});

	express.get('/get/project/:id', function (req, res) {
		glampipe.core.getProject(req.params.id, res);
	});



	// NODES

	express.get('/get/nodes/:project', function (req, res) {
		glampipe.core.getProjectNodes(req.params.project, res);
	});

	express.get('/get/nodes', function (req, res) {
		glampipe.core.getNodes(res);
	});


	express.get('/get/node/:id', function (req, res) {
		glampipe.core.getNode(req.params.id, res);
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

	express.post('/create/node', function (req, res) {
		glampipe.core.createNode(req.body, res, glampipe.io);
	});

	express.post('/create/collection/node', function (req, res) {
		glampipe.core.createCollectionNode(req.body, res, glampipe.io);
	});

	express.post('/delete/node', function (req, res) {
		glampipe.core.deleteNode(req.body, res, glampipe.io);
	});

	express.post('/set/node/position', function (req, res) {
		glampipe.core.setNodePosition(req.body, res);
	});

	express.post('/run/node/:id', function (req, res) {
		glampipe.core.runNode(req, res, glampipe.io);
		res.json({status:"started"});
	});



	// DATA
	express.get('/get/collection/:id', function (req, res) {
		glampipe.core.getCollection(req, {}, res);
	});

	express.get('/get/collection/byfield/:id', function (req, res) {
		glampipe.core.getCollectionByField(req, res);
	});

	express.get('/view/collection/:id', function (req, res) {
		glampipe.core.viewCollection(req.params.id, function(data) {res.send(data)});
	});

	express.get('/get/collection/fields/:id', function (req, res) {
		glampipe.core.getCollectionFields(req.params.id, function(data) {res.send(data)});
	});


	express.get('/get/collection/count/:id', function (req, res) {
		glampipe.core.getCollectionCount(req.params.id, function(data) {res.send(data)});
	});

	express.post('/edit/collection/:id', function (req, res) {
		glampipe.core.editCollection(req.params.id, req, function(data) {res.send(data)});
	});

	// UPLOAD
	express.post('/upload/file', upload.single('file'), function (req, res) {
		glampipe.core.uploadFile(req, res);
	});


	// NODE EDITOR
	express.get('/node-viewer', function (req, res) {
		res.sendFile(path.join(__dirname, 'views', 'node-editor.html'));
	});
}
