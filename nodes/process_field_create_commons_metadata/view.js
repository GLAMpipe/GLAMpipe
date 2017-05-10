
// "node.data.docs" contains current set (paged) of documents

var preview_url = "https://commons.wikimedia.org/w/index.php?title=Special:ExpandTemplates&wpInput=";

html = "";

    console.log(node.source.title);
    console.log(doc);
    console.log(node.source.params.out_field);
    
for(var i = 0; i < node.data.docs.length; i++) {
    var doc = node.data.docs[i];
    var wikitext_url = encodeURIComponent(doc[node.source.params.out_field]);

    html += "<div class='fatbox'>";
    html += "  <div class='inlinetitleblock'><span class='title'>" +doc[node.source.settings.title_dyn1] + "</span></div>";
    //html += "  <textarea class='big'>"+ doc[node.source.params.out_field] +"</textarea>";
    html += "  <a target='_blank' href='" + preview_url + wikitext_url + "'><div class='button'>Preview wikitext</div></a>";
    html += "</div>";
}

return html;
