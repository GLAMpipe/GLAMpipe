
if (context.data.responseHeader) {
    var numFound = parseInt(context.data.response.numFound, 10);
    var start = parseInt(context.data.response.start, 10);
    var totalPages = Math.ceil(numFound/context.node.settings.docs_per_page); 
    out.value = context.data.response.docs;

   var currentPage = start/context.node.settings.docs_per_page + 1; 
   out.say ("progress", "working on page " + currentPage + "/" + totalPages);

   if(start < numFound) {
        /* stop if sample is set and count is bigger than sample */
       if(currentPage >= context.node.sample_to) {
          out.url = "";
       } else {
           currentPage++;
           out.url = context.query_url + "&page=" + currentPage;
       }
   }



} else {
    out.say("error", "Your query failed! Please check query");
}
