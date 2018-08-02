const path			= require('path');

module.exports = function(express, GP) {

	var multer 		= require("multer");
	var path 		= require('path');
	var p			= path.join(GP.dataPath, 'tmp');  
	var upload 		= multer({ dest: p });
	express.set('superSecret', global.config.secret); // secret variable


	express.all("*", function (req, res, next) {

		console.log(req.method + req.url);
		next();
	});

	// main page
	express.get(global.config.uiPath, function (req, res) {
		res.sendFile(path.join(__dirname, 'views', 'index.html'));
	});

	// project page
	express.get(global.config.uiPath + 'project/:id', function (req, res) {
		res.sendFile(path.join(__dirname, '../views', 'project.html'));
	});
	
	express.get('/api/v1/config', function (req, res) {
		res.json({
			url:global.config.url,
			authentication:global.config.authentication,
			version:global.config.version,
			uiPath:global.config.uiPath,
			public:global.config.public,
			nodedevmode:global.config.nodeDevMode
			//dataPath:global.config.dataPath
		});
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




/* ***********************************************************************
 * 							NODES
 * ***********************************************************************
*/



/* ***********************************************************************
 * 							DATA
 * ***********************************************************************
*/

	express.get('/api/v1/collections/:collection/docs', function (req, res) {
		var docs = await GP.getDocs(req.params.collection, req.query);
		res.json(docs);
	});

	express.get('/api/v1/collections/:collection/fields', async function (req, res) {
		const schema = await GP.getSchema(req.params.collection);
		res.json(schema);
	});

}
