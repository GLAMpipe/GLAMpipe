
$( document ).ready(function() {
	
    var gp = new glamPipe();
    gp.getLoginStatus("#login", function(desktop) {
        if(desktop) {
            $("#user-box").hide();
            gp.getProjects("#projectList");
        } else {
            $("#project-box").hide();
            gp.getUsers("#userList");
        }
    });


    $("#user-box").on("click", "a", function (e) {
        var user = $(e.target).parents("a").data("id");
		gp.getProjectsByUser("data-workspace", user);
        e.preventDefault();
	});


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
