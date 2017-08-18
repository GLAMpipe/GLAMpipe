var c = context; 
var url = 'https://api.finna.fi/v1/search?'; 
var search = context.node.settings.search; 
var license = context.node.settings.license;  
c.var = {}; 
c.var.page = 1; 
c.var.limit = 20; 
c.var.total_count = 0;

/* list of returned fields */
var fields = [
	'buildings', 
	'formats', 
	'id', 
	'images', 
	'institutions', 
	'nonPresenterAuthors', 
	'summary', 
	'urls', 
	'title',
	'shortTitle',
	'subTitle' ,
	'year',  
	'onlineUrls', 
	'isbns', 
	'cleanIsbn', 
	'subjects',
	'series', 
	'recordPage',
	'physicalDescriptions'
];
 
var fields_str = ''; 
for (var i = 0; i< fields.length; i++) { 
   fields_str += '&field[]=' + fields[i]; 
} 

var query = search.split('?'); 
if (query.length == 2) { 
    
    //  remove limit 0 if exists
    query[1] = query[1].replace(/&?limit=0/,"?"); 

    /* add license to query if user chose it*/
    if(license != '') 
       c.var.url = url + query[1] + '&filter[]=' + license; 
    else 
       c.var.url = url + query[1];
    out.say('progress', c.var.url);
} else { 
    out.say('error', 'Haku ei onnistu! Kopioitko osoiterivin oikein?'); 
}

out.url = c.var.url + '&page=' + c.var.page + fields_str; 
c.var.query_url = out.url; 
