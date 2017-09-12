


$( document ).ready(function() {
	
	var gp = new glamPipe();
	gp.loadNodes();
	gp.getLoginStatus("#login");
	gp.loadProject("#projectList");


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
		$("#login").empty().append("<a class='button' id='login-pop' href=''>login</a> or <a href='/signup'>signup</a>");
		e.preventDefault();
	});

	// hide node settings panel on start
	$("data-workspace .settings").hide();
	$("data-workspace settingscontainer").hide();
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


	// hide/show node settings TODO: move to node
	$("settingscontainer").on("click", ".wikiglyph-caret-up", function (e) {
		$(this).removeClass("wikiglyph-caret-up");
		$(this).addClass("wikiglyph-caret-down");
		$("data-workspace .settings").hide();
		$("data-workspace submitblock").hide();
		$("data-workspace .node-description").hide();
	});

	$("settingscontainer").on("click", ".wikiglyph-caret-down", function (e) {
		$(this).removeClass("wikiglyph-caret-down");
		$(this).addClass("wikiglyph-caret-up");
		$("data-workspace .settings").show();
		$("data-workspace submitblock").show();
		$("data-workspace .node-description").show();
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
	$(document).on('click','.listoption', function(e) {
		gp.pickedCollectionId = null;
		console.log(gp.currentCollection.source.params.collection);
		gp.nodeRepository.openNodeParameters(e, gp.currentCollection.source.params.collection);
		e.preventDefault();
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
		var run_button_texts = ["run for all documents", "import data", "export data"];
		var button = $(e.target);
		if(run_button_texts.includes(button.text())) {
			button.attr("text", button.text());
			button.text("stop");
			gp.runNode(e);
		} else if(button.text() == "stop") {
			button.text("stopping node...");
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

	// open dynamic field picker
	//$(document).on('click','.dynamic_field', function(e) {
		//gp.openDynamicFieldSelector(e);
	//});

	// save node description 
	$(document).on('click','#node-description-save', function(e) {
		gp.saveNodeDescription($(".node-description-value").val());
		var node = gp.currentlyOpenNode.source;
		var nodeid = node._id;
		var desc = $(".node-description-value").val();
		if(desc) {
			$(".node[data-id='"+nodeid+"'] div.boxtitle").addClass("boxtext");
			$(".node[data-id='"+nodeid+"'] div.boxtext" ).text($(".node-description-value").val());
		} else {
			$(".node[data-id='"+nodeid+"'] div.boxtitle").removeClass("boxtext");
			$(".node[data-id='"+nodeid+"'] div.boxtitle" ).text(node.title);
		}
		e.preventDefault();
	})

	// open dynamic field picker
	$(document).on('click','.source_dynamic_field', function(e) {
		gp.openDynamicFieldSelector(e, "source");
	});

	// pick field
	$(document).on('click','.pick_field', function(e) {
		gp.pickField(e)
	});

	// open dynamic collection picker
	$(document).on('click','.dynamic_collection', function(e) {
		gp.openDynamicCollectionSelector(e);
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
		progressDisplay.show();
		progressDisplay.empty();
		progressDisplay.append("<div class=\"progress\">" + data.msg + "</div>");
	});

	socket.on('error', function (data) {
		if(data.node_uuid) {
			progressDisplay.append("<div class=\"bad\">" + data.msg + "</div>");
			$(".settings").removeClass("busy");
			progressDisplay.addClass("done");
		} else {
			genericDisplay.append("<div class=\"bad\">" + data + "</div>");
		}
		// revert "run" button text
		var button = $("button[data-id='"+data.node_uuid+"']");
		button.text(button.attr("text"));
		$("div[data-id='"+data.doc+"']").text("run only this");
		//websockPopup(progressDisplay, "Node run error");
	});

	socket.on('finish', function (data) {
		console.log("FINISH: " + data.msg);
		progressDisplay.empty().append("<div class=\"good\">" + data.msg + "</div>");
	   // websockPopup(finishDisplay, "Node done!");
		$(".settings").removeClass("busy");
		progressDisplay.addClass("done");
		progressDisplay.hide();
		gp.nodeRunFinished(data); 

	});

});

function getWSPath() {
	var paths = window.location.pathname.split("/");
	return "";
	
	if(paths[1] != "project")
		return "/" + paths[1];
	else
		return "";
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
