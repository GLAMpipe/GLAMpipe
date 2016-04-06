


module.exports = function(app, metapipe, io) {
	var multer 		= require("multer");
	var upload 		= multer({ dest: 'uploads/' });
	var path 		= require('path');

	// PROJECTS

	app.get('/', function (req, res) {
		res.sendFile(path.join(__dirname, 'views', 'index.html'));
	});

	app.get('/project/:id', function (req, res) {
		res.sendFile(path.join(__dirname, 'views', 'project.html'));
	});

	app.post('/create/project', function (req, res) {
		metapipe.createProject(req.body.title, res);
	});

	app.get('/get/projects', function (req, res) {
		metapipe.getProjects(res);
	});

	app.get('/get/project/:id', function (req, res) {
		metapipe.getProject(req.params.id, res);
	});



	// NODES

	app.get('/get/nodes/:project', function (req, res) {
		metapipe.getProjectNodes(req.params.project, res);
	});

	app.get('/get/nodes', function (req, res) {
		metapipe.getNodes(res);
	});


	app.get('/get/node/:id', function (req, res) {
		metapipe.getNode(req.params.id, res);
	});

	app.get('/node/view/:id', function (req, res) {
		metapipe.nodeView(req, function(data) {res.send(data)});
	});

	app.get('/node/editview/:id', function (req, res) {
		metapipe.nodeEditView(req, function(data) {res.send(data)});
	});

	app.get('/node/fileview/:id', function (req, res) {
		metapipe.nodeFileView(req, function(data) {res.send(data)});
	});

	app.post('/create/node', function (req, res) {
		metapipe.createNode(req.body, res, io);
	});

	app.post('/create/collection/node', function (req, res) {
		metapipe.createCollectionNode(req.body, res, io);
	});

	app.post('/delete/node', function (req, res) {
		metapipe.deleteNode(req.body, res, io);
	});

	app.post('/set/node/position', function (req, res) {
		metapipe.setNodePosition(req.body, res);
	});

	app.post('/run/node/:id', function (req, res) {
		metapipe.runNode(req, res, io);
		res.json({status:"started"});
	});



	// DATA
	app.get('/get/collection/:id', function (req, res) {
		metapipe.getCollection(req, {}, res);
	});

	app.get('/get/collection/byfield/:id', function (req, res) {
		metapipe.getCollectionByField(req, res);
	});

	app.get('/view/collection/:id', function (req, res) {
		metapipe.viewCollection(req.params.id, function(data) {res.send(data)});
	});

	app.get('/get/collection/fields/:id', function (req, res) {
		metapipe.getCollectionFields(req.params.id, function(data) {res.send(data)});
	});


	app.get('/get/collection/count/:id', function (req, res) {
		metapipe.getCollectionCount(req.params.id, function(data) {res.send(data)});
	});

	app.post('/edit/collection/:id', function (req, res) {
		metapipe.editCollection(req.params.id, req, function(data) {res.send(data)});
	});

	// UPLOAD
	app.post('/upload/file', upload.single('file'), function (req, res) {
		metapipe.uploadFile(req, res);
	});


	// NODE EDITOR
	app.get('/node-viewer', function (req, res) {
		res.sendFile(path.join(__dirname, 'views', 'node-editor.html'));
	});
}
