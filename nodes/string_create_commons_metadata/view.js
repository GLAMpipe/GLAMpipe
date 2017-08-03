
// "node" is passed as a parameter to this scripts
// "node.source.settings" includes node settings and "node.source.params" node's parameters
// "node.data.docs" contains current (paged) set of documents

var preview_url = "https://commons.wikimedia.org/w/index.php?title=Special:ExpandTemplates&wpInput=";

html = "";

    //console.log(node.source.title);
    //console.log(doc);
    //console.log(node.source.params.out_field);
    
for(var i = 0; i < node.data.docs.length; i++) {
    var doc = node.data.docs[i];
    var wikitext_url = encodeURIComponent(doc[node.source.params.out_field]);
    var title = "";
    if(node.source.settings.title_dyn1) // settings are not there before first run. 
		title = doc[node.source.settings.title_dyn1]

    html += "<div class='fatbox'>";
    html += "  <div class='inlinetitleblock'><span class='title'>" + title + "</span></div>";
    //html += "  <textarea class='big'>"+ doc[node.source.params.out_field] +"</textarea>";
    html += "  <a target='_blank' href='" + preview_url + wikitext_url + "'><div class='button'>Preview wikitext</div></a>";
    html += "</div>";
}

return html;
