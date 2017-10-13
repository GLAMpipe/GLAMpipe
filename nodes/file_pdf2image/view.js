// "node" is passed as a parameter to this scripts
// "node.source.settings" includes node settings and "node.source.params" node's parameters
// "node.data.docs" contains current (paged) set of documents


html = "";

    //console.log(node.source.title);
    //console.log(doc);
    //console.log(node.source.params.out_field);
    
for(var i = 0; i < node.data.docs.length; i++) {
    var doc = node.data.docs[i];
	var page = doc[node.source.params.out_page];
	if(!page)
		page = 0;

    html += "<div class='fatbox'>";
    //html += "  <textarea class='big'>"+ doc[node.source.params.out_field] +"</textarea>";
    html += "  <div data-id='"+doc._id+"' class='button run_single_view' data-id='"+doc._id+"'>run for this</div>";
    html += "  <div data-id='"+doc._id+"' class='button pdfcover_prev_page'> < </div>";
    html += "  <input data-id='"+doc._id+"' id='pdfcover_page' value='" + page + "'/>";
    html += "  <div data-id='"+doc._id+"' class='button pdfcover_next_page'> > </div>";
    if(doc[node.source.params.out_link] && doc[node.source.params.out_link][0])
		html += "<img class='cover-frame' src='http://localhost:3000" + doc[node.source.params.out_link][0] +"'/>";
    html += "</div>";
}

var url = "";

// EVENT HANDLERS 
$("datablock").off();
// off() is important since view.js gets called every time user clicks node

$("datablock").on("click", ".pdfcover_next_page", function(e) {
	var page = parseInt($("#pdfcover_page").val());
	var doc_id = $(this).data("id");
	page++;
	updateDb(page, doc_id, function() {
		self.runSingle(e);
	});

})

$("datablock").on("click", ".pdfcover_prev_page", function(e) {
	var page = parseInt($("#pdfcover_page").val());
	var doc_id = $(this).data("id");
	page--;
	if(page < 0)
		page = 0;
	updateDb(page, doc_id, function() {
		self.runSingle(e);
	});
})

// run node with single document
$("datablock").on('click','div.run_single_view', function(e) {
	self.runSingle(e);
});


var api_url = g_apipath + "/collections/" + node.source.collection + "/docs/";

function updateDb(match, doc, cb) {
	var data = {};
	// field name can be found on node params
	data[node.source.params.out_page] = match;
	
	//data.field = node.source.params.out_match;
	//data.value = match;
	var url = api_url + doc;
	
	var options = {
		url: url,
		method: "POST",
		data: data
	}
	apiCall(options, doc, function(err) {
		if(!err)
			cb();
		else
			alert(err);
	})

}

function apiCall (options, doc, cb) {
	// add auth
	options.headers = {"Authorization": "Bearer " + localStorage.getItem("token")}
	var post = $.ajax(options);
	post.done(function( msg ) {
		if(msg.error) 
			cb(msg.error, null);
		 else
			cb(null);
		
		
	});
}


return html;
