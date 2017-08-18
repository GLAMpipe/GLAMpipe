
// item in node parameters
var record = {};

// static values
record["@type"] =  "jyu.getpaid.products.publication";
record["product_language"] =  "fi";
record["product_category"] =  "58d0c9cd2e8a4600bbd46bc4042a213d";

record["title"] = "";
record["isbn"] = "";
record["keywords"] = "";

record["text--content-type"] = "text/html";
record["text--data"] = "";
record["text--encoding"] = "";






var record = {
  "@type": "jyu.getpaid.products.publication",
  "title": "",
  "description": "",
  "text": {
    "content-type": "text/html",
    "data": "<p>Kuvaus</p>",
    "encoding": "utf-8"
  },
  "author": "",
  "published": "",
  "publisher": "Suomen kasvatustieteellinen seura",
  "series": "Kasvatusalan tutkimuksia",
  "series_number": "",
  "isbn": "",
  "issn": "1458-1094",
  "binding": "nidottu",
  "distribution_format": "am",
  "keywords": [],
  "price": "0",

  "product_language": "fi",
  "product_category": "58d0c9cd2e8a4600bbd46bc4042a213d"
}

var img =   {"image": {
    "data": "",
    "encoding": "base64",
    "filename": "",
    "content-type": ""
  }
}

var html = "<table>";
html += "<thead><tr><th>Plone field</th><th>dynamic field</th><th>static field</th></tr></thead>";
for(key in record) {
	if(typeof record[key] === "object") {
		for(var key2 in record[key]) {
			var display_key = key + "." + key2;
			var nondot_key = display_key.replace(".", "--")
			html += "<tr>";
			html += "<td>" + display_key + "</td>";
		
			html += "<td><div><select name='_dynamic_" + nondot_key + "' class='node-settings dynamic_field middle_input' ><option value=''>no value, use static</option></select></div></td>";
			html += "<td><div><input name='_static_" + nondot_key + "' class='node-settings' value='" + record[key][key2]+ "'/></div></td>";
			html += "</tr>";
		}
		
	} else {
		html += "<tr>";
		html += "<td>" + key + "</td>";
	
		html += "<td><div><select name='_dynamic_" + key + "' class='node-settings dynamic_field middle_input' ><option value=''>no value, use static</option></select></div></td>";
		if(Array.isArray(record[key]))
			html += "<td><div><input name='_static_" + key + "' class='node-settings' value='array' disabled/></div></td>";
		else
			html += "<td><div><input name='_static_" + key + "' class='node-settings' value='" + record[key]+ "'/></div></td>";
		html += "</tr>";
	}
	
}
html += "</table>";

$("#format-plone-mapping").empty().append(html);


