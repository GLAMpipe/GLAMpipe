
 
var options = {
	headers: {'content-type' : 'application/x-www-form-urlencoded'},
	url: context.node.params.required_url + "/login", 
	method: 'POST',
	form: {"email": context.node.settings.username, "password": context.node.settings.password},
	json: true,
	jar:true
};

out.login = options;		
out.say("progress", "Trying to login to DSpace..."); 
