
var value = context.doc[context.node.params.in_field];
//value = "<root><title><nimi>Musti</nimi><rotu>Seka</rotu></title></root>"
//out.console.log(value)
var doc = new context.xmlParser().parseFromString(value, "text/xml")
var serializer = new context.xmlSerializer();
//var doc = parser.parseFromString(value)
var select = context.xpath.useNamespaces();

//var nodes = select("//marc:leader", doc);


var xmlnodes = select("//*[local-name() = 'controlfield']", doc);
out.console.log(xmlnodes.length)
//var tags = doc.getElementsByTagName("record")
//out.console.log(tags[0].toString())


//out.console.log(nodes[0].localName + ": " + nodes[0].firstChild.data)
//out.console.log("Node: " + nodes[0].toString())

out.value = "";

xmlnodes.forEach(function(xmlnode) {
	out.value += serializer.serializeToString(xmlnode) + "\n";
})

//var doc = context.xmldom.createDocument ('http://www.w3.org/1999/xhtml', 'html', null);
//var body = document.createElementNS('http://www.w3.org/1999/xhtml', 'body');
//body.setAttribute('id', 'abc');

var ndoc = new context.xmlParser().parseFromString("<root></root>", "text/xml")

//var ser = serializer.serializeToString(nodes);
//out.console.log(ser);
out.value = serializer.serializeToString(ndoc);
