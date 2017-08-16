// remove last / from url
if(context.node.params.url.trim().slice(-1) === "/")
	var login_url = context.node.params.url.trim() + "@login";
else
	var login_url = context.node.params.url.trim() + "/@login"


var options = {
	headers: {"content-type" : "application/json"},
	url: login_url, 
	method: 'POST',
	json: {"login": context.node.settings.username, "password": context.node.settings.password},
	jar:true
};

out.login = options;		
out.say("progress", "Trying to login to Plone..."); 

