
var config = { 
	"protocol": "http", 
	"url": context.node.params.dspace_url + "/login", 
	"status_url" : context.node.params.dspace_url + "/status",
	"debug": true, 
	"dryRun": false, 
	"login": {"email": context.node.settings.username, "password": context.node.settings.password},
	"userAgent": "GLAMpipe 0.0.1"       
}; 

out.config = config;		
out.say("progress", "Trying to login to DSpace..."); 

