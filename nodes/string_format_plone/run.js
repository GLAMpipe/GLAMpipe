



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

var record = {
  "@type": "jyu.getpaid.products.publication",
  "title": "Testisivu",
  "description": "Ari testaa ja kehittää",
  "text": {
    "content-type": "text/html",
    "data": "<p>Tämä on testisivu</p>",
    "encoding": "utf-8"
	},
  "product_language": "fi",
  "product_category": "58d0c9cd2e8a4600bbd46bc4042a213d",
  "price": 0.0
};

	
for(var key in item) {
	//record[key] = "";
}

record["@type"] =  "jyu.getpaid.products.publication";
record["product_language"] =  "fi";
record["product_category"] =  "58d0c9cd2e8a4600bbd46bc4042a213d";
record["title"] = context.doc["title"];
record["isbn"] = context.doc["isbn_clean"];
record["keywords"] = context.doc["subjects"];


out.value = record;  
