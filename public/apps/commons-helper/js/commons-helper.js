
// GLAMpipe-osoite
var gpurl = "http://localhost:3000" // local dev
var apiurl = gpurl + "/api/v1";
var filename = "";


$( document ).ready(function() {
	
    //var gp = new glamPipe();

	$("#upload-csv").click(function() {
		var date = new Date();
		var project_title = "Commons Helper " + date.toISOString();
		upload(function(data) {
			filename = data.filename;
			createCSVProject(project_title).then(function(data) {
				//$("#csv-upload").hide();
				//$("#result").append("<div>Projekti valmis!</div><a target='_blank' href='"+gpurl+"/project/" + globals.project + "'><button>avaa</button>");
			})
			.catch(function() {alert("error")});	
		});
	})
	
$('.custom-file-input').on('change',function() {
	console.log($(this).val());
  $(this).next('.form-control-file').addClass("selected").html($(this).val());
})
	
});


