var request     = require("request");
const MP 		= require("../config/const.js");
//const config 	= require("../config/config.js");
var exports 	= module.exports = {};



// simple white listed proxy
exports.proxyJSON = function (url, query, res) {
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
			console.log("PROXY:", "URL not allowed!");
			res.json({"error":"URL not allowed!"});
			return;
		}
	}
	

	var headers = {
		'User-Agent':       'GLAMpipe/0.0.1',
	}
	
	if(query)
		url = url + query;

    console.log("PROXY:", url);

	 var options = {
		url: url,
		method: 'GET',
		headers: headers,
		json: true
	};

	request(options, function (error, response, body) {
		if (!error && (response.statusCode == 200 || response.statusCode == 401)) {
			//console.log(body); 
			res.json(body);

		} else {
			console.log("error", error);
			res.json({"error":"could not get data via proxy!"});
			return;
		}
	});
}
