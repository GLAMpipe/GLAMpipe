
$( document ).ready(function() {
	
    var gp = new glamPipe();
	gp.getProjects("#projectList");
	 
	$("#create_project").on("click", function () {
		gp.addProject("pam");
	});
	
});
