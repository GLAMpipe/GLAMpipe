
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

	$(document).on("click", "#login-pop", function(e) {
		$("#login").empty();
		$("#login").append("<div id='login-popup'>username: <input id='username'/>password:<input id='password' type='password'/><button id='login-submit'>login</button></div>");
		e.preventDefault();
	});

	$(document).on("click", "#login-submit", function(e) {
		var user = $("#username").val()
		var pass = $("#password").val()
		if(user == "" || pass == "")
			alert("Give username and password")
		else 
			gp.login(user, pass)
			
		e.preventDefault();
	});

	$(document).on("click", "#logout", function(e) {
		localStorage.removeItem("token");
		$("#login").empty().append("<a id='login-pop' href=''>login</a>");
		e.preventDefault();
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
