const Koa			= require('koa');
const Router		= require('koa-router');
const bodyParser	= require('koa-body');
const serve			= require('koa-send');
const json			= require('koa-json')
const cors			= require('koa-cors')
const path			= require('path');
var debugRouter		= require('debug')('ROUTER');
var debug 			= require('debug')('GLAMpipe');
var GLAMpipe		= require('./app/glampipe.js');
var shibboleth		= require('./app/shibboleth.js');
var collection		= require('./app/new_collection.js');
var proxy			= require('./app/proxy.js');

var app				= new Koa();
var router			= new Router();
var GP 				= new GLAMpipe();

global.register = {};

//Set up body parsing middleware
app.use(bodyParser({
   formidable:{uploadDir: './data/uploads', maxFileSize: 20000 * 1024 * 1024},
   multipart: true,
   urlencoded: true
}));


app.use(json({ pretty: true, param: 'pretty' }))
app.use(cors());

app.use(async function handleError(context, next) {

	try {
		await next();
	} catch (error) {
		context.status = 500;
		if(error.message) {
			console.log('ERROR: ' + error.message);
			context.body = {'error':error.message};
		} else {
			console.log('ERROR: ' + error);
			context.body = {'error':error};
		}
		debug(error.stack);


	}
});

/***************************************************************************************************************
 *                                       VIEWS                                                               *
 * *************************************************************************************************************/

app.use(require('koa-static')('public'));

app.use(async (ctx, next) => {
	debugRouter(ctx.path)
	await next();
})

app.use(async (ctx, next) => {
	if ('/' == ctx.path) return serve(ctx, 'index.html', { root: __dirname + '/public' });
	else await next();
})

// auth
app.use(async (ctx, next) => {
	if(global.config.authentication === "shibboleth") {
		if(shibboleth.isValidUser(ctx)) {
			await next();
		} else {
			ctx.status = 401;
			ctx.body = {'error': ''};
		}

	} else if(global.config.authentication === "shibboleth") {
			if(ctx.get(global.config.shibboleth.headerId)) {
				var shib_user = ctx.get(global.config.shibboleth.headerId);
				if(global.config.shibboleth.dummyUser) shib_user = global.config.shibboleth.dummyUser  // DUMMY USERS
				if(global.config.shibboleth.users.includes(shib_user)) {
					res.json({"shibboleth":{user:shib_user}});
				} else {
					res.json({"shibboleth":{visitor:shib_user}});
				}
			}
	} else if(global.config.authentication === "none") {
		await next()
	}

})

router.get('/project/:id', function(ctx) {
	return serve(ctx, 'project.html', { root: __dirname + '/public' });
})

router.get('/node-editor/:node', function(ctx) {
	return serve(ctx, 'node-editor.html', { root: __dirname + '/public' });
})

/* ***********************************************************************
 * 							STATUS & CONFIG
 * ***********************************************************************
*/

router.get('/api/v2/config', function (ctx, next) {
	ctx.body = {
		file: global.config.file,
		url:global.config.url,
		authentication:global.config.authentication,
		version:global.config.version,
		database: global.config.database,
		uiPath:global.config.uiPath,
		public:global.config.public,
		nodedevmode:global.config.nodeDevMode,
		dataPath:global.config.dataPath
	};
});

router.get('/api/v2/config/reload', async function (ctx, next) {
	await GP.loadConfig();
	ctx.body = {"status":"ok"};
});

router.get('/api/v2/status', function (ctx) {
	ctx.body = {"status":"ok"};
});

router.get('/api/v2/user', async function (ctx) {
	ctx.body = await GP.getCurrentUser();
});

router.put('/api/v2/user/fields', async function (ctx) {
	ctx.body = await GP.setUserCollectionFields(ctx.request.body.collection, ctx.request.body.fields);
});

/* ***********************************************************************
 * 							PROJECTS
 * ***********************************************************************
*/

router.get('/api/v2/projects', async function (ctx, next) {
	ctx.body = await collection.getDocs('gp_projects', ctx.request.query);
});


router.get('/api/v2/projects/:id', async function (ctx) {
	const project = await GP.getProject(ctx.params.id);
	ctx.body = project;
});

router.post('/api/v2/projects', async function (ctx) {
	var project = await GP.createEmptyProject(ctx.request.body.title, ctx.request.body.description);
	var collection = await GP.createCollection(ctx.request.body.collection, project._id);
	project.collection = collection
	ctx.body = project;
});

router.put('/api/v2/projects/:id', async function (ctx) {
	const result = await GP.editProject(ctx.params.id, ctx.request.body);
	ctx.body = result;
});

router.delete('/api/v2/projects/:id', async function (ctx) {
	const project = await GP.deleteProject(ctx.params.id);
	ctx.body = project;
});


/* ***********************************************************************
 * 							FILES
 * ***********************************************************************
*/

router.get('/api/v2/nodes/:id/files/:file', async function (ctx) {
	var node = await GP.getNode(ctx.params.id);
	await node.getFile(ctx, ctx.params.file);

});


/* ***********************************************************************
 * 							NODE REPOSITORY
 * ***********************************************************************
*/

router.get('/api/v2/repository/nodes/:nodeid/settings', async function (ctx) {
	ctx.body = await GP.getNodeSettingsTemplate(ctx.params.nodeid);
});

router.get('/api/v2/repository/nodes/:nodeid', async function (ctx) {
	ctx.body = await GP.getDocByQuery('gp_repository', {'nodeid': ctx.params.nodeid});
});

// list of nodes available
router.get('/api/v2/repository/nodes', async function (ctx) {
	ctx.body = await GP.getDocs('gp_repository', ctx.request.query);
});

router.get('/api/v2/options', async function (ctx) {
	ctx.body = await GP.getDocs('gp_node_options', {});
});

router.get('/api/v2/options/:label', async function (ctx) {
	ctx.body  = await GP.getDocByQuery('gp_node_options', {'label': ctx.params.label});
});

router.post('/api/v2/options/:label', async function (ctx) {
	var options = await GP.addOption(ctx.params.label, ctx.request.body);
	ctx.body = options;
});

router.get('/api/v2/repository/reload', async function (ctx) {
	var options = await GP.loadNodes();
	ctx.body = options;
});

/* ***********************************************************************
 * 							NODES
 * ***********************************************************************
*/

router.get('/api/v2/register', async function (ctx) {
	ctx.body = global.register;
});

// set label
router.post('/api/v2/nodes/:id/label', async function (ctx) {
	var node = await GP.getNode(ctx.params.id);
	await node.setLabel(ctx.query.label);
	if(node) ctx.body = node.source.label;
});

// get by label or UUID
router.get('/api/v2/nodes/:id', async function (ctx) {
	var node = await GP.getNode(ctx.params.id);
	if(node) ctx.body = node.source;
});

// create
router.post('/api/v2/nodes', async function (ctx) {
	var node = await GP.createNode(ctx.request.body.nodeid, ctx.request.body.params, ctx.request.body.collection, ctx.request.body.project);
	ctx.body = node;
});

// delete
router.delete('/api/v2/nodes/:id', async function (ctx) {
	var result = await GP.removeNode(ctx.params.id);
	ctx.body = result;
});

// start and return immediately
router.post('/api/v2/nodes/:id/start', function (ctx) {
	GP.startNode(ctx.params.id, ctx.request.body);
	ctx.body = {status:"started", ts:  new Date()};
});

// run
router.post('/api/v2/nodes/:id/run', async function (ctx) {
	var res = await GP.startNode(ctx.params.id, ctx.request.body);
	ctx.body = res;
});

// run for single doc
router.post('/api/v2/nodes/:id/run/:doc', async function (ctx) {
	var res = await GP.startNode(ctx.params.id, ctx.request.body, ctx.params.doc);
	ctx.body = res;
});

// get settings
router.get('/api/v2/nodes/:id/settings', async function (ctx) {
	var node = await GP.getNode(ctx.params.id);
	if(node) ctx.body = node.source.settings;
});

// set node description
router.post('/api/v2/nodes/:id/settings/description', async function (ctx) {
	var node = await GP.getNode(ctx.params.id);
	await node.setDescription(ctx.request.body);
	if(node) ctx.body = node.source.node_description;
});

// set settings
router.post('/api/v2/nodes/:id/settings', async function (ctx) {
	var node = await GP.getNode(ctx.params.id);
	await node.saveSettings(ctx.request.body);
	if(node) ctx.body = node.source.settings;
});


// upload file
router.post('/api/v2/nodes/:id/upload', async function(ctx, next) {

	var node = await GP.getNode(ctx.params.id);
	var upload = await node.upload(ctx)
	ctx.body = upload;
});

//router.post('/api/v2/nodes/:id/upload', async function (ctx) {
	//var node = await GP.getNode(ctx.params.id);
	//await node.upload(ctx.request.body);
	//if(node) ctx.body = "uploading"
//});




/* ***********************************************************************
 * 							PIPES
 * ***********************************************************************
*/


router.put('/api/v2/pipes', async function(ctx) {

	var pipe = await GP.createPipe(ctx.request.query.name);
	ctx.body = pipe;
})

router.post('/api/v2/pipes/:name', async function(ctx) {

	var pipe = await GP.addNodes2Pipe(ctx.params.name, ctx.body);
	ctx.body = pipe;
})

router.get('/api/v2/pipes/:name', async function(ctx) {
	var pipe = await GP.getPipe(ctx.params.name, ctx.body);
	ctx.body = pipe;
})

router.get('/api/v2/pipes', async function(ctx) {
	var pipes = await GP.getPipes();
	ctx.body = pipes;
})

/* ***********************************************************************
 * 							NODE EDITING
 * ***********************************************************************
*/

router.get('/api/v2/nodes/:id/scripts/:script', async function (ctx) {
	var script = await GP.getNodeScript(ctx.params.id, ctx.params.script);
	ctx.body = script;
});

router.get('/api/v2/nodes/:id/scripts', async function (ctx) {
	var script = await GP.getNodeScript(ctx.params.id);
	ctx.body = script;
});

router.put('/api/v2/nodes/:id/scripts/:script', async function (ctx) {
	var result = await GP.editNodeScript(ctx.params.id, ctx.params.script, ctx.request.body);
	ctx.body = result;
});

router.put('/api/v2/nodes/:id/scripts/:script/revert', async function (ctx) {
	var result = await GP.revertNodeScript(ctx.params.id, ctx.params.script);
	ctx.body = result;
});

/* ***********************************************************************
 * 							DATA
 * ***********************************************************************
*/

router.get('/api/v2/collections/:collection/docs', async function (ctx) {
	var docs = await collection.getDocs(ctx.params.collection, ctx.request.query);
	ctx.body = docs;
});

router.post('/api/v2/collections/:collection/docs', async function (ctx) {
	var docs = await collection.insertDoc(ctx.params.collection, ctx.request.body);
	ctx.body = {"data": docs};
});

router.get('/api/v2/collections/:collection/docs/:id', async function (ctx) {
	var doc = await GP.getDoc(ctx.params.collection, ctx.params.id);
	ctx.body = doc;
});

router.put('/api/v2/collections/:collection/docs/:id', async function (ctx) {
	var doc = await GP.updateDoc(ctx.params.collection, ctx.params.id, ctx.request.body);
	ctx.body = doc;
});

router.delete('/api/v2/collections/:collection/docs/:id', async function (ctx) {
	var doc = await GP.deleteDoc(ctx.params.collection, ctx.params.id);
	ctx.body = doc;
});

router.get('/api/v2/collections/:collection/fields', async function (ctx) {
	const schema = await GP.getSchema(ctx.params.collection);
	if(schema) ctx.body = schema; else ctx.body = {};
});

router.get('/api/v2/collections/:collection/schema', async function (ctx) {
	const schema = await GP.getSchema(ctx.params.collection);
	if(schema) ctx.body = schema; else ctx.body = {};
});

router.get('/api/v2/collections/:collection/count', async function (ctx) {
	const count = await GP.getDocCount(ctx.params.collection, ctx.request.query);
	ctx.body = {"count": count};
});

router.get('/api/v2/collections/:collection/nodes', async function (ctx) {
	const nodes = await GP.getCollectionNodes(ctx.params.collection);
	ctx.body = {"nodes": nodes};
});

router.get('/api/v2/collections/:collection/facet', async function (ctx) {
	const facet = await collection.facet(ctx);
	ctx.body = facet;
});

router.get('/api/v2/collections', async function (ctx) {
	var collections = await GP.getCollections();
	ctx.body = collections;
})

router.post('/api/v2/collections', async function (ctx) {
	var collection 	= await GP.createCollection(ctx.request.body.title, ctx.request.body.project);
	ctx.body = collection;
})

router.delete('/api/v2/collections/:collection', async function (ctx) {
	var collection 	= await GP.deleteCollection(ctx.params.collection);
	ctx.body = collection;
})

router.put('/api/v2/collections/:collection/schema', async function (ctx) {
	const schema = await GP.createSchema(ctx.params.collection);
	if(schema) ctx.body = schema; else ctx.body = {};
});

/* ***********************************************************************
 * 							CRON
 * ***********************************************************************
*/

router.get('/api/v2/cron', async function (ctx) {
	var jobs = await GP.getJobs();
	ctx.body = jobs;
})

router.get('/api/v2/cron/node/:id', async function (ctx) {
	var job = await GP.getCronJob(ctx.params.id);
	ctx.body = job;
})

router.post('/api/v2/cron/node/:id', async function (ctx) {
	var job = await GP.createCronJob(ctx.params.id, ctx.request.body);
	ctx.body = job;
})


/* ***********************************************************************
 * 							PROXY
 * ***********************************************************************
*/

router.get('/api/v2/proxy', async function (ctx) {

	var res = await proxy.proxyJSON(ctx);
	ctx.body = res;
});

router.post('/api/v2/proxy/', function (ctx) {
	proxy.proxyJSON(req, res);
});

router.put('/api/v2/proxy/', function (ctx) {
	proxy.proxyJSON(req, res);
});

/* ***********************************************************************
 * 							VIEWS
 * ***********************************************************************
*/

router.get('/views/:node/:dir/:file', async function (ctx) {
	var node = await GP.getNode(ctx.params.node);
	node.getPublicFile(ctx);
});

router.get('/views/:node', async function (ctx) {
	var node = await GP.getNode(ctx.params.node);
	node.getPublicIndex(ctx);
});


/* ***********************************************************************
 * 							CORE
 * ***********************************************************************
*/

router.get('/api/v2/cores', async function (ctx) {
	var cores = await GP.getCores();
	ctx.body = cores;
});


router.get('/api/v2', function (ctx) {
	ctx.body = router.stack.map(i => i.methods[i.methods.length-1] +": "+ i.path);
});



var server = require('http').createServer(app.callback())

GP.init(server).then(function() {
	app
	.use(router.routes())
	.use(router.allowedMethods());

	server.listen(global.config.port);

}).catch(function(e) {
	console.log(e)
});
