// "node" is passed as a parameter to this scripts
// "node.source.settings" includes node settings and "node.source.params" node's parameters
// "node.data.docs" contains current (paged) set of documents


html = "";

    //console.log(node.source.title);
    //console.log(doc);
    //console.log(node.source.params.out_field);
    
for(var i = 0; i < node.data.docs.length; i++) {
    var doc = node.data.docs[i];


    html += "<div class='fatbox'>";
    //html += "  <textarea class='big'>"+ doc[node.source.params.out_field] +"</textarea>";
    html += "  <div class='button pdfcover_prev_page'> < </div>";
    html += "  <input id='pdfcover_page' value='0'/>";
    html += "  <div class='button pdfcover_next_page'> > </div>";
    html += doc.script_out_download_pdfimages_link + dd;
    html += "</div>";
}


// EVENT HANDLERS 
$("datablock").off(); // off() is important since view.js gets called every time user clicks node

$("datablock").on("click", ".pdfcover_next_page", function(e) {
	var page = parseInt($("#pdfcover_page").val());
	page++;
	$("#pdfcover_page").val(page);
})

$("datablock").on("click", ".pdfcover_prev_page", function(e) {
	var page = parseInt($("#pdfcover_page").val());
	page--;
	if(page < 0)
		page = 0;
	$("#pdfcover_page").val(page);
})

return html;
