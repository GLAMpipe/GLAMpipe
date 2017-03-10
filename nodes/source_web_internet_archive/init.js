var query = context.node.params.query.replace("https://archive.org/search.php?query=", "");

var u = '&fl[]=identifier&fl[]=title&fl[]=description&fl[]=collection&fl[]=source&fl[]=creator&rows='+context.node.params.docs_per_page+'&output=json';

out.url = 'https://archive.org/advancedsearch.php?q=' + query + u;
 /* since out.url gets wiped every run, lets save query in other variable*/
context.query_url = out.url;
out.say ('news', 'starting to fetch query ' + out.url);
           
if(context.node.settings.sample_to != null)
    context.node.sample_to = parseInt(context.node.settings.sample_to);
else
    context.node.sample_to = 9999999999;
