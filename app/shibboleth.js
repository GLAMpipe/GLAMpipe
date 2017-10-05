

// checks that we have valid shibboleth user
exports.isValidUser = function(req, res, next) {

	// first check if route should be open
	var pass = false;
	global.config.IP_passes.some(function(IP_pass) {
		if(req.path.includes(IP_pass.path) && req.method === IP_pass.method && (req.ip === IP_pass.ip || IP_pass.ip === "*")) {
			pass = true;
			console.log("INFO: allowed by IP_pass: " + IP_pass.label)
		}
	})
	if(pass)
		return next();

	var user = getUser(req);
	if(user) {
		if(global.config.shibbolethUsers.includes(user)) 
			next();
		else
			res.status(401).json({error:"Not authenticated!"});
	} else {
			res.status(401).json({error:"Not authenticated!"});
	}
}


// checks that we have valid shibboleth user
exports.addHeadersToData = function(req) {
	// add shibboleth headers to data
	if(global.config.authentication === "shibboleth" && Array.isArray(global.config.shibbolethHeadersToData)) {
		global.config.shibbolethHeadersToData.forEach(function(header) {
			req.body[header] = encoding.convert(req.headers[header], "Latin_1").toString(); // not sure why this encoding conversion works...
		});
		console.log(req.body)
	}

}



function getUser(req) {
	if(global.config.authentication === "shibboleth" && req.headers[global.config.shibbolethHeaderId]) 
		return req.headers[global.config.shibbolethHeaderId];
	else if(global.config.authentication === "local") {
		if(req.user && req.user.local && req.user.local.email && req.user.local.email) {
			return req.user.local.email;
		}
	}
	return "";
}
