const Koa 			= require('koa');
const Router 		= require('koa-router');
const bodyParser 	= require('koa-body');
const serve 		= require('koa-send');
const json 			= require('koa-json')
const path			= require('path');
var GLAMpipe 		= require('./app/glampipe.js');
var collection 		= require('./app/new_collection.js');
var proxy 			= require('./app/proxy.js');
 
var app 			= new Koa();
var router 			= new Router();
var GP 				= new GLAMpipe();

global.register = {};

//Set up body parsing middleware
app.use(bodyParser({
   formidable:{uploadDir: './uploads'},    //This is where the files would come
   multipart: true,
   urlencoded: true
}));


app.use(json({ pretty: true, param: 'pretty' }))

app.use(async function handleError(context, next) {
  try {
    await next();
  } catch (error) {
	  console.log(error);
    context.status = 500;
    context.body = error;
  }
});

/***************************************************************************************************************
 *                                       VIEWS                                                               *
 * *************************************************************************************************************/

app.use(require('koa-static')('public'));

app.use(async (ctx, next) => {
  if ('/' == ctx.path) return serve(ctx, 'index.html', { root: __dirname + '/views' });
  else await next();
})

router.get('/projects/:id', function(ctx) {
	return serve(ctx, 'project.html', { root: __dirname + '/views' });
})

/* ***********************************************************************
 * 							STATUS & CONFIG
 * ***********************************************************************
*/

router.get('/api/v2/config', function (ctx, next) {
	ctx.body = {
		url:global.config.url,
		authentication:global.config.authentication,
		version:global.config.version,
		uiPath:global.config.uiPath,
		public:global.config.public,
		nodedevmode:global.config.nodeDevMode,
		dataPath:global.config.dataPath
	};
});


router.get('/api/v2/status', function (ctx) {
	ctx.body = {"status":"ok"};
});


/* ***********************************************************************
 * 							PROJECTS
 * ***********************************************************************
*/

router.get('/api/v2/projects', async function (ctx, next) {
	ctx.body = await GP.getProjects();
});


router.get('/api/v2/projects/:id', async function (ctx) {
	const project = await GP.getProject(ctx.params.id);
	ctx.body = project;
});

router.post('/api/v2/projects', async function (ctx) {
	var project = await GP.createEmptyProject(ctx.request.body.title);
	var collection = await GP.createCollection("test", project._id);
	ctx.body = project;
});

router.delete('/api/v2/projects/:id', async function (ctx) {
	const project = await GP.deleteProject(ctx.params.id);
	ctx.body = project;
});
	

/* ***********************************************************************
 * 							NODE REPOSITORY
 * ***********************************************************************
*/

// list of nodes available
router.get('/api/v2/repository/nodes', async function (ctx) {
	const nodes = await GP.repository();
	ctx.body = nodes;
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

/* ***********************************************************************
 * 							NODES
 * ***********************************************************************
*/


// create
router.post('/api/v2/nodes/:id', async function (ctx) {
	var node = await GP.createNode(ctx.params.id, ctx.request.body.params, ctx.request.body.collection, ctx.request.body.project);
	ctx.body = node;
});

// delete
router.delete('/api/v2/nodes/:id', async function (ctx) {
	var result = await GP.removeNode(ctx.params.id);
	ctx.body = result;
});

// start
router.post('/api/v2/nodes/:id/start', function (ctx) {
	GP.startNode(ctx.params.id, ctx.request.body);
	ctx.body = {status:"started", ts:  new Date()};
});


/* ***********************************************************************
 * 							DATA
 * ***********************************************************************
*/

router.get('/api/v2/collections/:collection/docs', async function (ctx) {
	var docs = await collection.getDocs(ctx.params.collection, ctx.query);
	ctx.body = {"data": docs};
});

router.get('/api/v2/collections/:collection/docs/:id', async function (ctx) {
	var doc = await GP.getDoc(ctx.params.collection, ctx.params.id);
	ctx.body = doc;
});

router.get('/api/v2/collections/:collection/fields', async function (ctx) {
	const schema = await GP.getSchema(ctx.params.collection);
	if(schema) ctx.body = schema; else ctx.body = {}; 
});

router.get('/api/v2/collections/:collection/count', async function (ctx) {
	const count = await GP.getDocCount(ctx.params.collection);
	ctx.body = {"count": count};
});

router.get('/api/v2/collections/:collection/facet', async function (ctx) {
	const facet = await collection.facet(ctx);
	ctx.body = facet;
});

router.post('/api/v2/collections', async function (ctx) {
	var collection 	= await GP.createCollection(ctx.request.body.title, ctx.request.query.project);
	ctx.body = collection;
})


router.get('/api/v2/proxy/', async function (ctx) {
	ctx.body = await proxy.proxyJSON(ctx);
});

router.post('/api/v2/proxy/', function (ctx) {
	proxy.proxyJSON(req, res);
});

router.put('/api/v2/proxy/', function (ctx) {
	proxy.proxyJSON(req, res);
});


var server = require('http').createServer(app.callback())
GP.init(server);
//var io = require('socket.io')(server)
 
app
	.use(router.routes())
	.use(router.allowedMethods());

server.listen(3000);
