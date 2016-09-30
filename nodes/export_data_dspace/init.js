
        
out.say('progress', 'Starting to upload..'); 
context.counter = 0;

var rest_url = context.node.settings.url;
var collection = context.node.settings.collection;

// upload url
out.url = rest_url + "/collections/" +collection+ "/items/";
