const Koa 			= require('koa');
const Router 		= require('koa-router');
const bodyParser 	= require('koa-body');
const serve 		= require('koa-send');
const json 			= require('koa-json')
const path			= require('path');
var GLAMpipe 		= require('./app/glampipe.js');
 
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

app.use(async (ctx, next) => {
  if ('/' == ctx.path) return serve(ctx, 'index.html', { root: __dirname + '/views' });
  else await next();
})

router.get('/api/v2', async function (ctx) {
	ctx.body = 'API'
});


/* ***********************************************************************
 * 							PROJECTS
 * ***********************************************************************
*/

router.get('/api/v2/projects', async function (ctx, next) {
	ctx.body = await GP.getProjects();
});

router.get('/testi', (ctx, next) => {
	// ctx.router available
	ctx.body = 'Hello World';
});

 
app
	.use(router.routes())
	.use(router.allowedMethods());

app.listen(3000);
