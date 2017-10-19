
var apis = {
	"beta":			"commons.wikimedia.beta.wmflabs.org", 
	"production": 	"commons.wikimedia.org"
	}; 
	
var config = { 
   "protocol": 	"https", 
    "server": 	apis[context.node.params.server], 
    "path": 	"/w",  
    "debug": 	true, 
    "username": context.node.settings.username, 
    "password": context.node.settings.password, 
    "dryRun": 	false, 
    "userAgent": "Metapipe 0.0.1 via nodemw"       
}; 

out.botconfig = config;
            
if(context.node.settings.username == "" || context.node.settings.password == "")
	context.abort = true;

out.say("progress", "Trying to login to commons..."); 
out.url = apis[context.node.params.server] +"/w/api.php?action=query&meta=tokens&type=login"; 
