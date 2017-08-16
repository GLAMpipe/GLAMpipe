

var item = {
  "@type": "jyu.getpaid.products.publication",
  "title": "REST -testijulkaisu",
  "description": "Ari testaa ja kehittää",
  "text": {
    "content-type": "text/html",
    "data": "<p>Kuvaus</p>",
    "encoding": "utf-8"
  },
  "author": "Rantala, Jukka; Rautiainen, Matti",
  "published": 2013,
  "publisher": "Suomen kasvatustieteellinen seura",
  "series": "Kasvatusalan tutkimuksia",
  "series_number": 64,
  "isbn": "978-952-5401-66-0",
  "issn": "1458-1094",
  "binding": "nidottu",
  "distribution_format": "am",
  "image": {
    "data": "R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
    "encoding": "base64",
    "filename": "minimal.gif",
    "content-type": "image/gif"
  },
  "price": 0.0,
  "keywords": [
    "1970-luku",
    "1980-luku",
    "1990-luku",
    "2000-luku"
  ],
  "product_language": "fi",
  "product_category": "58d0c9cd2e8a4600bbd46bc4042a213d"
}


var out_link = context.doc[context.node.params.out_link];


var options = {
	url: out.url,  // from init.js
	json: context.doc[context.node.params.in_field],
	headers: {
		"accecpt": "application/json",
		"authorization": "Bearer " + context.login.token
	}
};

// if there is an url in out_link, then we do not run again
if(out_link && typeof out_link == "string" && out_link.match(/^http/))
	context.skip = true;



if(parseInt(context.count) % 10 == 0) 
    out.say("progress", context.node.type.toUpperCase() + ": processed " + context.count + "/" + context.doc_count);

out.pre_value = options;
