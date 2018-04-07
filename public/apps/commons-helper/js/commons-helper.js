
// GLAMpipe-osoite
var gpurl = "http://localhost:3000" // local dev
var apiurl = gpurl + "/api/v1";
var filename = "";


$( document ).ready(function() {
	
    var gp = new GLAMpipe();
    

	$("#upload-csv").click(function() {
		$("#node-progress").empty();
		var date = new Date();
		var project_title = "Commons Helper " + date.toISOString();
		upload(function(data) {
			filename = data.filename;
			createCSVProject(project_title).then(function(data) {
				//$(".preview-block").removeClass("d-none"); // show block
				$(".upload-block").addClass("d-none"); // hide block
				$(".template-block").removeClass("d-none"); // hide block
				$(".footer").append("<a class='btn btn-primary footer' target='_blank' href='"+gpurl+"/project/" + globals.project + "'>Go Pro! Your GLAMpipe project is here!</a>");
				
			})
			.catch(function() {alert("error")});	
		});
	})
	
	$('.dropdown-item').on('click',function() {
		$(".template-block").addClass("d-none");
		createWikitext().then(function(data) {
			$(".preview-block").removeClass("d-none");
			renderData();
		})
	})
	
	$('.custom-file-input').on('change',function() {
		console.log($(this).val());
	  $(this).next('.form-control-file').addClass("selected").html($(this).val());
	})

	// websocket stuff
	var gp_path = getWSPath();
	var socket = io.connect(window.location.origin, {path: gp_path + '/socket.io'});
	var progressDisplay = $("#node-progress");
	var finishDisplay = $("#node-finished");
	var genericDisplay = $("#generic-messages");

	socket.on('progress', function (data) {
		//if(data.project == gp.currentProject) {
			//progressDisplay.append("<div class='alert alert-info'>" + data.msg + "</div>");
		//}
	});

	socket.on('error', function (data) {
		//if(data.project == gp.currentProject) {

			progressDisplay.empty().append("<div class='bad'>" + data.msg + "</div>");

		//}
		//websockPopup(progressDisplay, "Node run error");
	});

	socket.on('finish', function (data) {
		//if(data.project == gp.currentProject && data.node_uuid == gp.currentlyOpenNode.source._id) {
			console.log("FINISH: " + data.msg);
			progressDisplay.append("<div class='alert alert-success'>" + data.msg + "</div>");
		   // websockPopup(finishDisplay, "Node done!");
			$(".settings").removeClass("busy");
			progressDisplay.addClass("done");
		//}
	});
});



function getWSPath() {
	var paths = window.location.pathname.split("/");
	if(paths.length === 3)
		return "";
		
	if(paths[paths.length-2] === "project") {

		return "/" + paths.slice(1, paths.length-2).join("/");
	} else {
		return "";
	}
}



