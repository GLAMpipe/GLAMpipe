var c = context; 
if(context.response && context.response.statusCode == 200 && context.data.resultCount) {
    var numFound = parseInt(context.data.resultCount, 10);
         var pageCount = Math.ceil(numFound/c.var.limit)  ; 
         out.say('progress', 'Fetching page ' + c.var.page + ' of '+pageCount+ ' Total records: ' + numFound); 
         var imgBase = 'https://api.finna.fi'; 
         var result = [];
         var out_records = [];  
         c.var.page++; 
      
         if (context.data.records && context.data.records.constructor.name == 'Array') { 
             createDocs(context.data.records);
         }

         out.value = out_records; 
      
         var limit = parseInt(context.node.settings.limit); 
         if (limit <= 0 || isNaN(limit)) 
             limit = 999999999; 
      
         /* check if there is any data left on the server */
        if(c.var.page <= pageCount && c.var.page <= limit) 
             out.url = c.var.url + '&page=' + c.var.page; 
} else {
    out.say('error', 'Your query failed! Please check query'); 
    out.value = null; 
}




function createDocs (recs) {

         /* we do some data cleaning here */
         out.say("progress", recs);
         for(var i = 0; i < recs.length; i++) {
      
             var out_rec = {}; 
             out_rec.rights = ''; 
             out_rec.description = ''; 
             out_rec.title = ''; 
             out_rec.image_url = ''; 
             out_rec.thumbnail_html = ''; 
             out_rec.id = ''; 
             out_rec.rights = ''; 
             out_rec.year = ''; 
             out_rec.subjects = []; 
             out_rec.buildings = []; 
             out_rec.formats = []; 
             out_rec.authors = []; 
             out_rec.institutions = []; 
             out_rec.query = c.var.query_url; 
      
             if(recs[i].images) {
                 out_rec.image_url = imgBase + recs[i].images[0]; 
                 out_rec.thumbnail_html = '<img src=\"' + out_rec.image_url + '&w=300&h=300\"/>'; 
             } 
      
             /* make sure that we always have 'subjects' as ARRAY */
             if (recs[i].subjects) 
                 out_rec.subjects = recs[i].subjects; 

             if (recs[i].title) 
                 out_rec.title = recs[i].title; 

             if (recs[i].year) 
                 out_rec.year = recs[i].year; 

             if (recs[i].id) 
                 out_rec.finna_id = recs[i].id; 
      
             if (recs[i].summary) 
                 out_rec.description = recs[i].summary; 


             if (out_rec.imageRights) 
                 recs[i].rights =  recs[i].imageRights.copyright; 

             /* institutions */     
             if (recs[i].institutions && recs[i].institutions.constructor.name == 'Array') { 
                 var institutions = recs[i].institutions; 
                 var institutionsArr = []; 
                 for(var j = 0; j < institutions.length; j++) {
                     institutionsArr.push(institutions[j].translated); 
                 }
                 out_rec.institutions = institutionsArr; 
             } 


             /* buildings */     
             if (recs[i].buildings && recs[i].buildings.constructor.name == 'Array') { 
                 var buildings = recs[i].buildings; 
                 var buildingsArr = []; 
                 for(var j = 0; j < buildings.length; j++) {
                     buildingsArr.push(buildings[j].translated); 
                 }
                 out_rec.buildings = buildingsArr; 
             } 


             /* formats */  
             if (recs[i].formats && recs[i].formats.constructor.name == 'Array') { 
                 var formats = recs[i].formats; 
                 var formatsArr = []; 
                 for(var j = 0; j < formats.length; j++) {
                     formatsArr.push(formats[j].translated); 
                 }
                 out_rec.formats = formatsArr; 
             } 
      

             /* authors */  
             if(recs[i].nonPresenterAuthors && recs[i].nonPresenterAuthors.constructor.name == 'Array') {
                 var authors = recs[i].nonPresenterAuthors; 
                 var authorArr = []; 
                 for(var j = 0; j < authors.length; j++) {
                     authorArr.push(authors[j].name); 
                 }
                 out_rec.authors = authorArr; 
             }
      
             out_records.push(out_rec); 
      
         }

}
