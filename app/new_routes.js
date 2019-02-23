const path		= require('path');
var debug 		= require('debug')('GLAMpipe:router');
var collection 	= require('./new_collection.js');
var Project 	= require('./new_project.js');
var proxy 		= require("./proxy.js");

module.exports = function(express, GP) {

	var multer 		= require("multer");
	var path 		= require('path');
	var p			= path.join(GP.dataPath, 'tmp');  
	var upload 		= multer({ dest: p });
	
	// try/catch catcher
	function wrapAsync(fn) {
	  return function(req, res, next) {
		fn(req, res, next).catch(next);
	  };
	}


	express.set('superSecret', global.config.secret); // secret variable

	express.all("*", function (req, res, next) {

		debug(req.method + ' ' + req.url);
		next();
	});

/***************************************************************************************************************
 *                                       VIEWS                                                               *
 * *************************************************************************************************************/


	// main page
	express.get(global.config.uiPath, function (req, res) {
		res.sendFile(path.join(__dirname, '../views', 'index.html'));
	});

	// project page
	express.get(global.config.uiPath + 'project/:id', function (req, res) {
		res.sendFile(path.join(__dirname, '../views', 'project.html'));
	});

	// editor page
	express.get(global.config.uiPath + 'editor', function (req, res) {
		res.sendFile(path.join(__dirname, '../views', 'node-editor.html'));
	});
	
	
	
	express.get('/api/v1/config', function (req, res) {
		res.json({
			url:global.config.url,
			authentication:global.config.authentication,
			version:global.config.version,
			uiPath:global.config.uiPath,
			public:global.config.public,
			nodedevmode:global.config.nodeDevMode,
			dataPath:global.config.dataPath
		});
	});


	express.get('/api/v1/status', function (req, res) {
		res.json({"status":"ok"});
	});


/* ***********************************************************************
 * 							PROJECTS
 * ***********************************************************************
*/

	express.get('/api/v1/projects', async function (req, res) {
		const projects = await GP.getProjects();
		res.json(projects);
	});

	express.get('/api/v1/projects/:id', async function (req, res) {
		const project = await GP.getProject(req.params.id);
		res.json(project);
	});

	express.post('/api/v1/projects', async function (req, res) {
		var project = await GP.createEmptyProject(req.body.title);
		var collection = await GP.createCollection("test", project._id);
		res.json(project);
	});

	express.delete('/api/v1/projects/:id', async function (req, res) {
		const project = await GP.deleteProject(req.params.id);
		res.json(project);
	});

/* ***********************************************************************
 * 							NODES
 * ***********************************************************************
*/

	express.get('/api/v1/repository/nodes', async function (req, res) {
		const nodes = await GP.repository();
		res.json(nodes);
	});

	express.post('/api/v1/projects/:project/nodes/:node', async function (req, res) {
		var node = await GP.createNode(req.params.node, req.body.params, req.body.collection, req.params.project,);
		res.json(node);
	});

	express.delete('/api/v1/projects/:project/nodes/:node', async function (req, res) {
		var result = await GP.removeNode(req.params.project, req.params.node);
		//res.json(result);
	});
	
	express.post('/api/v1/nodes/:id/start', function (req, res) {
		GP.startNode(req.params.id, req.body);
		res.json({status:"started", ts:  new Date()});
	});

/* ***********************************************************************
 * 							DATA
 * ***********************************************************************
*/

	express.get('/api/v1/collections/:collection/docs', async function (req, res) {
		var docs = await collection.getDocs(req.params.collection, req.query);
		res.json({"data": docs});
	});

	express.get('/api/v1/collections/:collection/docs/:id', async function (req, res) {
		var doc = await GP.getDoc(req.params.collection, req.params.id);
		res.json(doc);
	});

	express.get('/api/v1/collections/:collection/fields', async function (req, res) {
		const schema = await GP.getSchema(req.params.collection);
		if(schema) res.json(schema); else res.json({}); 
	});

	express.get('/api/v1/collections/:collection/count', async function (req, res) {
		const count = await GP.getDocCount(req.params.collection);
		res.json({"count": count});
	});

	express.get('/api/v1/collections/:collection/facet', async function (req, res) {
		const facet = await collection.facet(req);
		res.json(facet);
	});

	express.post('/api/v1/collections', async function (req, res) {
		var collection 	= await GP.createCollection(req.body.title, req.query.project);
		res.json(collection);
	})

/* ***********************************************************************
 * 							PROXY
 * ***********************************************************************
*/
	express.get('/api/v1/proxy/', function (req, res) {
		proxy.proxyJSON(req, res);
	});

	express.post('/api/v1/proxy/', function (req, res) {
		proxy.proxyJSON(req, res);
	});

	express.put('/api/v1/proxy/', function (req, res) {
		proxy.proxyJSON(req, res);
	});


/* ***********************************************************************
 * 							ERROR HANDLING
 * ***********************************************************************
*/

	express.use(function(error, req, res, next) {
	  // called because of 'wrapAsync()'
		debug(error.name)
		if(error.name === 'not_found') {
			res.status(404).json({ message: error.message });
		} else { 
			res.status(500).json({ message: error.message });
		}
	});
	

}
