var requestPromise = require('request-promise-native');
const MP 		= require("../config/const.js");
var exports 	= module.exports = {};



// simple white listed proxy
exports.proxyJSON = async function (ctx) {
	
	var url = ctx.query.url;
    if (typeof url === "undefined" || url == "")
        return res.json({"error":"no url"});

	// if server installation then we restrict the proxy to white list
	if(global.config.authentication !== "none") {
		var allowed = global.config.PROXY_passes.some(function(pass) {
			pass = pass.replace("/", "\/");
			var re = new RegExp("^" + pass);
			return url.match(re);
		})
		
		if(!allowed) {
			console.log("PROXY:", "URL not allowed!", url);
			return {"error":"URL not allowed!"};
		}
	}
	

	var headers = {
		'User-Agent': 'GLAMpipe/0.0.1'
	}
	
	if(ctx.query.query)
		url = url + ctx.query.query;

	console.log("PROXY:", ctx.method, ":", url);

	 var options = {
		url: url,
		method: ctx.method,
		headers: headers,
		json:true,
		jar: true		// TODO: remove since problematic on login cookies (ALL requests are then authenticated!)
	};

	return requestPromise(options);

}
