

$(function() {


	var dspace = new DSpaceREST();
	dspace.changeInstance();
	dspace.renderStatus("#dspace-login-status");
	dspace.renderDataTree("tree");
	dspace.treeClick = function(data) {
		console.log(data);

		if(data.type === "collection") {
			$("#result").empty();
			$("#result").append(data.text);			
			dspace.currentCollection = data.id;
		}
		
	}


	var piper = new GLAMpipePiper();

	// CHOOSE PIPE handler
	$("#pipe-choose").change(function (event) {
		$("#glampipe-info").text($("#pipe-choose").val());
	})


	// RUN PIPE handler
	$("#pipe-run").click(function (event) {
		var pipeName = $("#pipe-choose").val();
		var pipe = pipes[pipeName];
		console.log("url:", pipe.collections[0].nodes[0].params.dspace_url);
		console.log("collection:", pipe.collections[0].nodes[0].settings.dspace_handle);
		pipe.collections[0].nodes[0].settings.dspace_handle = dspace.currentCollection;
		console.log("collection:", pipe.collections[0].nodes[0].settings.dspace_handle);
		
		if(!dspace.currentCollection)
			alert("valitse kokoelma!");
		else
			piper.createAndRunProject(pipe);
	})


});









