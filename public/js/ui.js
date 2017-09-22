
$( document ).ready(function() {
	

    var gp = new glamPipe();
    
    gp.getStatus("#node-progress");
    
    gp.getLoginStatus("#login", function(desktop) {
        if(desktop) {
            $("#user-box").hide();
            gp.getProjects("#projectList");
        } else {
            $("#project-box").hide();
            if(gp.user)
				gp.getProjectsByUser("#projectList", gp.user);
            else
				gp.getProjects("#projectList");
            gp.getUsers("#userList");
        }
    });

	$(document).on("click", "#login-pop", function(e) {
		$("#login").empty();
		$("#login").append("<div id='login-popup'>username: <input id='username'/>password: <input id='password' type='password'/><button class='button' id='login-submit'>login</button></div>");
		$("#username").focus();
		e.preventDefault();
	});

	// login button
	$(document).on("click", "#login-submit", function(e) {
		login(gp);
		e.preventDefault();
	});

	// login with enter
	$(document).on("keyup", "#login-popup input", function(e) {
		 var key = e.which;
		 if(key == 13)  {
			login(gp);  
		}
	});


	$(document).on("click", "#logout", function(e) {
		localStorage.removeItem("token");
		$("#login").empty().append("<a class='button' id='login-pop' href=''>login</a> or <a href='/signup'>signup</a>");
		gp.getProjects("#projectList");
		e.preventDefault();
	});

    $("#user-box").on("click", "a", function (e) {
        var user = $(e.target).parents("a").data("id");
		gp.getProjectsByUser("#projectList", user);
        e.preventDefault();
	});


	$("#create_project").on("click", function () {
		addProject(gp);
	});

	$(".create_project #title").on("keyup", function (e) {
		 var key = e.which;
		 if(key == 13)  {
			addProject(gp);  
		}
	});

	// remove project
	$(document).on('click', ".del", function(e) {
		gp.removeProject(e);
		e.stopPropagation();
		e.preventDefault();
	})

});

function login(gp) {
	var user = $("#username").val()
	var pass = $("#password").val()
	if(user == "" || pass == "")
		alert("Give username and password")
	else 
		gp.login(user, pass)
}

function addProject(gp) {
	if ($(".create_project #title").val().trim() == "")
		alert("Please give a title for the project!");
	else {
		var title = $(".create_project #title").val().trim();
		gp.addProject(title);
	}
}
