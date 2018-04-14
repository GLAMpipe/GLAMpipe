
// GLAMpipe-osoite
var gpurl = "http://localhost:3000" // local dev
var apiurl = gpurl + "/api/v1";
var filename = "";


/* TODO
 * - GLAMpipe and commons logins
 * - pipe: try to download, if no extension then raise error
 * - pipe: download, checksum, check "check if file is in commons"
 * - pipe: upload as separate  "upload"
 * - There must be queue for uploads (when upload return, then start new one from the queue)
 * 
 * */

$( document ).ready(function() {
	
    var helper = new Helper();

	$("#upload-csv").click(function() {
		$("#node-progress").empty();
		var date = new Date();
		var project_title = "Commons Helper " + date.toISOString();
		upload(function(data) {
			filename = data.filename;
			helper.createCSVProject(project_title).then(function(data) {
				//$(".preview-block").removeClass("d-none"); // show block
				//helper.checkFields()
					$(".upload-block").addClass("d-none");      // hide block
					$(".template-block").removeClass("d-none"); // show block
					//$("#node-progress").empty().append("<div class='alert alert-warning'>You data does not include all necessary fields!</div>");
				
				$(".footer").append("<a class='btn btn-primary footer' target='_blank' href='/project/" + helper.project + "'>Go Pro! Your GLAMpipe project is here!</a>");
				
			})
			.catch(function(status) {
				$(".upload-block").addClass("d-none"); 
				if(status && status.includes("columns")) {
					$("#node-progress").empty().append("<div class='alert alert-warning'>Could not import your data! <br>Are you sure that the separator of your csv is comma?</div>");
				} else {
					$("#node-progress").empty().append("<div class='alert alert-warning'>" + status + "</div>");
				}
				$("#node-progress").append("<br><br><br><br><a class='btn btn-primary footer' target='_blank' href='/project/" + helper.project + "'>You can try different import settings in GLAMpipe-project</a>");

			});
		});
	})
	
	$('.dropdown-item').on('click',function() {
		$(".template-block").addClass("d-none");
		var template = $(this).data("id");
		helper.createWikitext(template).then(function(data) {
			$(".preview-block").removeClass("d-none");
			helper.renderData();
			
		})
	})
	
	$('.custom-file-input').on('change',function() {
		console.log($(this).val());
	  $(this).next('.form-control-file').addClass("selected").html($(this).val());
	})


	// upload -button
	$('body').on('click','.upload', function() {
		$(this).text("checking...");
		helper.checkIfCommons($(this));
	})

});






