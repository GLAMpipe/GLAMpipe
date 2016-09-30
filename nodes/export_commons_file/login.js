var config = { 
   "protocol": "http", 
    "server": "commons.wikimedia.beta.wmflabs.org", 
    "path": "/w",  
    "debug": true, 
    "username": context.node.settings.username, 
    "password": context.node.settings.password, 
    "dryRun": false, 
    "userAgent": "Metapipe 0.0.1 via nodemw"       
}; 
out.botconfig = config;
            
var apis = ["https://commons.wikimedia.org","http://commons.wikimedia.beta.wmflabs.org"]; 
out.say("progress", "Trying to login to commons..."); 
out.url = apis[parseInt(context.node.settings.api)] +"/w/api.php?action=query&meta=tokens&type=login"; 
