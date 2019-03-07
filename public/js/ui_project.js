


$( document ).ready(function() {
	
	var gp = new glamPipe();
	gp.getLoginStatus("#login");
	gp.loadProject("#projectList");


	$(document).on("click", "#login-pop", function(e) {
		$("#login").empty();
		$("#login").append("<div id='login-popup'>username: <input id='username'/>password:<input id='password' type='password'/><div class='button' id='login-submit'>login</div> <a id='login-cancel' href='#'>cancel</a> </div>");
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

	$(document).on("click", "#login-cancel", function(e) {
		$("#login").empty();
		$("#login").append("<div class='button' id='login-pop'>login</div> or <a href='/signup'>signup</a>");
		e.preventDefault();
	});

	$(document).on("click", "#logout", function(e) {
		localStorage.removeItem("token");
		$("#login").empty().append("<a class='button' id='login-pop' href=''>login</a> or <a href='/signup'>signup</a>");
		e.preventDefault();
	});

	// hide node settings panel on start
	$("settingsblock").hide();
	$("data-workspace submitblock").hide();

	// COLLECTION CHOOSER
	$("#collection-list").on("click", function (e) {
		gp.showCollections();
		$(gp.collectionListDiv).toggle()
		e.preventDefault();
	});

	$("#collection-prev").on("click", function (e) {
		gp.prevCollection();
	});

	$("#collection-next").on("click", function (e) {
		gp.nextCollection();
	});


	// toggle node settings
	$("settingscontainer").on("click", "settingsheader", function (e) {
		$("settingsblock").toggle();
		$("data-workspace submitblock").toggle();
	});



	// dynamic bindings
	$(document).on('click','.add-node', function(e) {
		gp.showNodeList(e);
		e.preventDefault();
	})

	$(document).on('click','.collection-item', function(e) {
		var index = $(e.target).data("index");
		gp.chooseCollection(index);
		$(gp.collectionListDiv).toggle()
		e.preventDefault();
	})

	// node accordion
	$(document).on('click','.accordion', function(e) {
		this.classList.toggle("active");
		this.nextElementSibling.classList.toggle("show");
		e.preventDefault();
	})

	// open node parameters for new node
	//$(document).on('click','.listoption', function(e) {
		//gp.pickedCollectionId = null;
		//console.log(gp.currentCollection.source.params.collection);
		//gp.nodeRepository.openNodeParameters(e, gp.currentCollection.source.params.collection);
		//e.preventDefault();
	//})

	$(document).on('click','.open-node', function(e) {
		e.preventDefault();
		gp.nodeRepository.openNodeParameters($(this), gp.currentCollection.source.params.collection);
		
	})

	// create collection
	$(document).on('click','.add-collection', function(e) {
		$(gp.collectionListDiv).toggle()
		gp.createCollection(e);
		e.preventDefault();
	})

	// create node
	$(document).on('click','.create-node', function(e) {
		gp.createNode(e);
		e.preventDefault();
	})

	// run node
	$(document).on('click','.run-node', function(e) {
		var run_button_texts = ["Batch run", "Import data", "Export data"];
		var button = $(e.target);
		if(run_button_texts.includes(button.text())) {
			button.attr("text", button.text());
			button.text("Stop");
			gp.runNode(e);
		} else if(button.text() == "Stop") {
			button.text("Stopping node...");
			gp.stopNode(e);
		} 
		e.preventDefault();
	})


	// open project node 
	$(document).on('click','.box.node', function(e) {
		gp.openNode(e);
		e.stopPropagation();
		e.preventDefault();
	})

	// remove node
	$(document).on('click','.node .wikiglyph-cross', function(e) {
		gp.removeNode(e);
		e.stopPropagation();
		e.preventDefault();
	})

	$(document).on('click','.remove-collection', function(e) {
		var nodeid = $(e.target).data("id");
		gp.removeNode(e, nodeid);
		e.stopPropagation();
		e.preventDefault();
		gp.loadProject();
	});

	// open dynamic field picker
	//$(document).on('click','.dynamic_field', function(e) {
		//gp.openDynamicFieldSelector(e);
	//});

	// save node description 
	$(document).on('click','#node-description-save', function(e) {
		var desc = $(".node-description-value").val().trim();
		gp.saveNodeDescription(desc);
		var node = gp.currentlyOpenNode.source;
		var nodeid = node._id;
		
		if(desc) {
			$(".node[data-id='"+nodeid+"'] div.title" ).text(desc);
			$(".node[data-id='"+nodeid+"'] div.description" ).text(node.title);
		} else {
			$(".node[data-id='"+nodeid+"'] div.title" ).text(node.title);
			$(".node[data-id='"+nodeid+"'] div.description" ).text(node.description);
		}
		e.preventDefault();
	})



	// pick field
	$(document).on('click','.pick_field', function(e) {
		gp.pickField(e)
	});

	// fetch fields when non-current collection is chosen
	$(document).on('change','.dynamic_collection', function(e) {
		gp.renderDynamicCollectionFieldList($('.source_dynamic_field'), e);
	})

	// pick collection
	$(document).on('click','.pick_collection', function(e) {
		gp.pickCollection(e)
	});

	// handler for file upload node creation
	$(document).on('submit', "#uploadfile", function(e) {

	});

	// show debug info of the node
	$(document).on("click", ".show-node-params", function(e) {
		websockPopup(gp.debugInfo(e), "node parameters and id");
	});

	// esc closes some dialogs
	$(document).keyup(function(e) {
		 if (e.keyCode == 27) { 
			 // simply clear all params holders
			$(".holder.params").empty();
			$(".holder.collection-params").empty();
		}
	});

	// websocket stuff
	var gp_path = getWSPath();
	var socket = io.connect(window.location.origin, {path: gp_path + '/socket.io'});
	var progressDisplay = $("#node-progress");
	var finishDisplay = $("#node-finished");
	var genericDisplay = $("#generic-messages");

	socket.on('progress', function (data) {
		console.log("PROGRESS: " + data.msg);
		if(data.project == gp.currentProject) {
			progressDisplay.show();
			progressDisplay.empty();
			progressDisplay.append("<div>" + data.msg + "</div>");
		}
	});

	socket.on('error', function (data) {
		if(data.project == gp.currentProject) {

			progressDisplay.empty().append("<div class='bad'>" + data.msg + "</div>");

			// revert batch run button text
			var button = $("button[data-id='"+data.node_uuid+"']");
			button.text(button.attr("text"));
			// revert singe run links
			$("a[data-id='"+data.doc+"']").text("Run for this");
		}
		//websockPopup(progressDisplay, "Node run error");
	});

	socket.on('finish', function (data) {
		console.log("FINISH: " + data.msg);
		if(data.project == gp.currentProject && data.node_uuid == gp.currentlyOpenNode.source._id) {
			
			progressDisplay.empty().append("<div>" + data.msg + "</div>");
		   // websockPopup(finishDisplay, "Node done!");
			$(".settings").removeClass("busy");
			progressDisplay.addClass("done");
			//progressDisplay.hide();
			gp.nodeRunFinished(data); 
		}

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

function websockPopup(div, title) {
		$(div).dialog({
			title:title,
			modal:true,
			resizable: false,
			width:500,
			dialogClass: "no-close",
			buttons: {
				"Ok": function() {
				  $( this ).empty();
				  $( this ).dialog( "close" );
				}
			}
		});	
}
