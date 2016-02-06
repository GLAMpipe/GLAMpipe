


module.exports = function(app, metapipe) {
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

    app.get('/get/node/settings/:node', function (req, res) {
        metapipe.getNodeSettings(req.params.node, res);
    });

    app.get('/node/view/:id', function (req, res) {
        metapipe.nodeView(req.params.id, function(data) {res.send(data)});
    });

    app.post('/create/node', function (req, res) {
        metapipe.createNode(req.body, res);
    });

    app.post('/delete/node', function (req, res) {
        metapipe.deleteNode(req.body, res);
    });

    app.post('/create/source/node', function (req, res) {
        metapipe.createSourceNode(req.body, res);
    });

    app.post('/set/node/position', function (req, res) {
        metapipe.setNodePosition(req.body, res);
    });

    app.post('/run/node/:id', function (req, res) {
        metapipe.runNode(req, res);
    });



    // DATA
    app.get('/get/collection/:id', function (req, res) {
        metapipe.getCollection(req, res);
    });

    app.get('/view/collection/:id', function (req, res) {
        metapipe.viewCollection(req.params.id, function(data) {res.send(data)});
    });

    app.get('/get/collection/fields/:id', function (req, res) {
        metapipe.getCollectionFields(req.params.id, function(data) {res.send(data)});
    });


    // UPLOAD
    app.post('/upload/file', upload.single('file'), function (req, res) {
        metapipe.importFile(req, res);
    });

}
