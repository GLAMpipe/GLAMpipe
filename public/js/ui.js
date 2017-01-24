
$( document ).ready(function() {
	
    var gp = new glamPipe();
	gp.getProjects("#projectList");
	gp.getLoginStatus("#login");
	 
	$("#create_project").on("click", function () {
		gp.addProject("pam");
	});

	// remove project
	$("#projectList").on('click', ".wikiglyph-cross", function(e) {
		gp.removeProject(e);
		e.stopPropagation();
		e.preventDefault();
	})

	
});
