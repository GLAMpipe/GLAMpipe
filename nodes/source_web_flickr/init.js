
if(context.node.settings.apikey == "") { 
	out.say("error", "You must give an API key!"); 
	context.init_error = "API key missing"; 
} else {
	var base_url = "https://api.flickr.com/services/rest/?method=flickr.photosets.getPhotos";
	var format = "&extras=license,url_q,url_m,url_o,description,license,date_taken,date_upload&format=json&nojsoncallback=?";
	out.url = base_url + "&photoset_id=" + context.node.settings.album + format + "&api_key=" + context.node.settings.apikey;
	out.say("news", out.url); 
}
