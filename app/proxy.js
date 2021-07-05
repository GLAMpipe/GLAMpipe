var axios 		= require('axios');
const MP 		= require("../config/const.js");
var exports 	= module.exports = {};



// simple white listed proxy
exports.proxyJSON = async function (ctx) {

	var url = ctx.query.url;
    if (typeof url === "undefined" || url == "") {
        throw({"error":"no url"});
        return
	}

	// if server installation then we restrict the proxy to white list
	if(global.config.authentication !== "none") {
		console.log('PROXY')
		var allowed = global.config.proxy.passes.some(function(pass) {
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
		headers: headers
	};

	var response = await axios(options);
	return response.data

}
