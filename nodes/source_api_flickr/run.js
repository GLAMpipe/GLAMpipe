
if (context.data.stat == "fail") { 
    out.say("error", context.data.message); 
    context.node_error = context.data.message; 

} else { 
    /* data cleaning: /* 

    /* - delete description object (remains as description_str */
    for (var i=0; i < context.data.photoset.photo.length; i++) { 
      context.data.photoset.photo[i].description_str = context.data.photoset.photo[i].description._content; 
      context.data.photoset.photo[i].thumbnail_html = "<img src='" + context.data.photoset.photo[i].url_q + "'/>"; 
      delete context.data.photoset.photo[i].description; 
    }

    out.value = context.data.photoset.photo;
}
