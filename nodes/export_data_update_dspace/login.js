
var apis = ["http://siljo.lib.jyu.fi:8080","http://siljo.lib.jyu.fi:8080"]; 
var url = apis[parseInt(context.node.settings.api)] +"/rest/login"; 

var config = { 
	"protocol": "http", 
	"url": url + "/rest/login" , 
	"status_url": url + "/rest", 
	"debug": true, 
	"dryRun": false, 
	"login": {"email": context.node.settings.username, "password": context.node.settings.password},
	"userAgent": "GLAMpipe 0.0.1"       
}; 

out.config = config;
out.say("progress", "Trying to login to Dspace address: " + url); 

