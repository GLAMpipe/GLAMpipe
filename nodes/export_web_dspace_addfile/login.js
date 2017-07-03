

var options = {
	headers: {'content-type' : 'application/x-www-form-urlencoded'},
	url: context.node.params.url + "/login", 
	method: 'POST',
	form: {"email": context.node.settings.username, "password": context.node.settings.password},
	json: true,
	jar:true
};

var config = { 
	"protocol": "http", 
	"url": context.node.params.url + "/login", 
	"status_url" : context.node.params.url + "/status",
	"debug": true, 
	"dryRun": false, 
	"login": {"email": context.node.settings.username, "password": context.node.settings.password},
	"userAgent": "GLAMpipe 0.0.1"       
}; 

out.login = options;		
out.say("progress", "Trying to login to DSpace..."); 

