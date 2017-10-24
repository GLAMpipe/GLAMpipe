
// "node" is passed as a parameter to this scripts
// "node.source.settings" includes node settings and "node.source.params" node's parameters
// "doc" contains current document

var preview_url = "https://commons.wikimedia.org/w/index.php?title=Special:ExpandTemplates&wpInput=";
var wikitext_url = encodeURIComponent(doc[node.source.params.out_field]);

// this gets appended to an "action" cell
return  "  <div><a target='_blank' href='" + preview_url + wikitext_url + "'>PREVIEW</a><div>";


