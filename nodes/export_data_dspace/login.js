var config = { 
	"protocol": "http", 
	"server": "http://siljo.lib.jyu.fi:8080/rest/login", 
	"debug": true, 
	"dryRun": false, 
	"login": {"email": context.node.settings.username, "password": context.node.settings.password,},
	"userAgent": "GLAMpipe 0.0.1"       
}; 
out.config = config;
			
out.say("progress", "Trying to login to Dspace..."); 
out.url = context.node.settings.url; 
out.login_url = context.node.settings.url + "/login"; 
out.status_url = context.node.settings.url + "/status"; 
