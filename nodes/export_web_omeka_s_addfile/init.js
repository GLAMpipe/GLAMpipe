
        
out.say('progress', 'Starting to add files..'); 
context.counter = 0;
context.success_counter = 0;

var rest_url = context.node.params.required_url;
out.url = rest_url + "/media?key_identity=" +context.node.settings.key_identity + "&key_credential=" + context.node.settings.key_credential ;





