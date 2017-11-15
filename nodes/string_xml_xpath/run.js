
out.value 	= "";
var value 	= context.doc[context.node.params.in_field];

var doc 		= new context.xmlParser().parseFromString(value, "text/xml")
var serializer 	= new context.xmlSerializer();
var select 		= context.xpath.useNamespaces();

// var select = context.xpath.useNamespaces({"marc": "http://www.loc.gov/MARC21/slim"});
// var nodes = select("//marc:leader", doc);


var xmlnodes = select(context.node.settings.query, doc);


if(context.node.settings.xmldoc == "true") {
	// create a new XML document
	var ndoc = new context.xmlParser().parseFromString("<root></root>", "text/xml")
	xmlnodes.forEach(function(xmlnode) {
		var c = xmlnode.cloneNode(true);
		ndoc.documentElement.appendChild(ndoc.importNode(c, true));
	})
	out.value = serializer.serializeToString(ndoc);
	
} else {
	// serialize to strings 
	xmlnodes.forEach(function(xmlnode) {
		out.value += serializer.serializeToString(xmlnode) + "\n";
	})
}

if(!(context.count % 100)) 
	out.say("progress", context.count + " processed...");
