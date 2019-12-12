

// checks that we have valid shibboleth user
exports.isValidUser = function(ctx) {

	// first check if route should be open
	var pass = false;
	//global.config.IP_passes.some(function(IP_pass) {
		//if(req.path.includes(IP_pass.path) && req.method === IP_pass.method && (req.ip === IP_pass.ip || IP_pass.ip === "*")) {
			//pass = true;
			//console.log("INFO: " + req.method + " allowed by IP_pass: " + IP_pass.label)
		//}
	//});
	
	if(pass) {
		return next();
	}

	var user = ctx.get(global.config.shibboleth.headerId);
	if(global.config.shibboleth.dummyUser) user = global.config.shibboleth.dummyUser  // DUMMY USERS
	
	if(user) {
		if(global.config.shibboleth.users.includes(user)) {  // user OK
			ctx.user = user;
			return true;
		} else {
			return false;
		}
	} else {
			return false;
	}
}


// add shibboleth headers to data (like displayname and email)
exports.addHeadersToData = function(req) {
	
	if(global.config.authentication === "shibboleth" && Array.isArray(global.config.shibbolethHeadersToData) && global.config.shibbolethHeadersToData.length > 0) {
		var encoding = require("encoding");
		global.config.shibbolethHeadersToData.forEach(function(header) {
			if(global.config.shibbolethHeadersEncoding !== "UTF-8") {
				req.body[header] = encoding.convert(req.headers[header], global.config.shibbolethHeadersEncoding).toString(); 
			} else {
				req.body[header] = req.headers[header]; 
			}
		});
	}
}

