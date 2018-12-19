var request     = require("request");
const MP 		= require("../config/const.js");
var exports 	= module.exports = {};



// simple white listed proxy
exports.proxyJSON = function (req, res) {
	
	var url = req.query.url;
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
			res.json({"error":"URL not allowed!"});
			return;
		}
	}
	

	var headers = {
		'User-Agent': 'GLAMpipe/0.0.1',
		'Content-Type': 'application/json'
	}
	
	if(req.query.query)
		url = url + req.query.query;

	console.log("PROXY:", req.method, ":", url);

	 var options = {
		url: url,
		method: req.method,
		headers: headers,
		json:true,
		jar: true		// TODO: remove since problematic on login cookies (ALL requests are then authenticated!)
	};
	
	// for adding CollectiveAccess list items
	if(options.method == "PUT") {
		options.body = req.body;
	}

	request(options, function (error, response, body) {
		if (response && !error && (response.statusCode == 200 || response.statusCode == 401)) {
			res.status(response.statusCode).json(body);

		} else {
			console.log("error", error);
			if(response) res.status(response.statusCode).json({"error": error});
			else res.status(503).json({"error": error});
			return;
		}
	});
}
