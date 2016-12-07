
$( document ).ready(function() {
	
	var gp = new glamPipe();
	gp.loadNodes();
	gp.loadProject("#projectList");

	// hide node settings panel on start
	$("data-workspace .settings").hide();
	$("data-workspace .settingscontainer").hide();

	// COLLECTION CHOOSER
	$("#collection-chooser").on("click", function (e) {
		gp.showCollections(e);
		e.preventDefault();
	});

	$(".col_choose").on("click", function (e) {
		alert("jop");
		e.preventDefault();
	});

	$("#collection-prev").on("click", function (e) {
		gp.prevCollection();
	});

	$("#collection-next").on("click", function (e) {
		gp.nextCollection();
	});


	// hide/show node settings TODO: move to node
	$(".settingscontainer").on("click", ".wikiglyph-caret-up", function (e) {
		$(this).removeClass("wikiglyph-caret-up");
		$(this).addClass("wikiglyph-caret-down");
		$("data-workspace .settings").hide();
	});

	$(".settingscontainer").on("click", ".wikiglyph-caret-down", function (e) {
		$(this).removeClass("wikiglyph-caret-down");
		$(this).addClass("wikiglyph-caret-up");
		$("data-workspace .settings").show();
	});



	// dynamic bindings
	$(document).on('click','.add-node', function(e) {
		gp.showNodeList(e);
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
		gp.nodeRepository.openNodeParameters(e);
		e.preventDefault();
	})

	// create node
	$(document).on('click','.create-node', function(e) {
		gp.createNode(e);
		e.preventDefault();
	})

	// run node
	$(document).on('click','.run-node', function(e) {
		gp.runNode(e);
		e.preventDefault();
	})


	// open project node 
	$(document).on('click','.box.node', function(e) {
		gp.openNode(e);
		e.stopPropagation();
		e.preventDefault();
	})

	// remove node
	$(document).on('click','.node  .wikiglyph-cross', function(e) {
		gp.removeNode(e);
		e.stopPropagation();
		e.preventDefault();
	})

	// open dynamic field picker
    $(document).on('click','.dynamic_field', function(e) {
		gp.openDynamicFieldSelector(e);
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

	// esc closes some dialogs
	$(document).keyup(function(e) {
		 if (e.keyCode == 27) { 
			 // simply clear all params holders
			$(".holder.params").empty();
			$(".holder.collection-params").empty();
		}
	});



    // websocket stuff
    var socket = io.connect('http://localhost');
    var progressDisplay = $("#node-progress");
    var finishDisplay = $("#node-finished");
    var genericDisplay = $("#generic-messages");

    socket.on('hello', function (data) {
        progressDisplay.empty();
        finishDisplay.empty();
        if(data.nodeid) {
            progressDisplay.append("<div class=\"error\">" + data.msg + "</div>");
        } else {
            genericDisplay.append(data + "</br>");
            //tailScroll(cons) ;
        }
    });

    
    socket.on('news', function (data) {
        if(data.nodeid) {
            progressDisplay.prepend("<div class=\"error\">" + data.msg + "</div>");
        } else {
            genericDisplay.prepend(data + "</br>");
        }
    });

    socket.on('progress', function (data) {
		progressDisplay.show();
		progressDisplay.empty();
        progressDisplay.append("<div class=\"progress\">" + data.msg + "</div>");
    });

    socket.on('error', function (data) {
        if(data.nodeid) {
            progressDisplay.append("<div class=\"bad\">" + data.msg + "</div>");
            $(".settings").removeClass("busy");
            progressDisplay.addClass("done");
        } else {
            genericDisplay.append("<div class=\"bad\">" + data + "</div>");
        }
        websockPopup(progressDisplay, "Node run error");
    });

    socket.on('finish', function (data) {

		
        finishDisplay.empty().append("<div class=\"good\">" + data.msg + "</div>");
        websockPopup(finishDisplay, "Node done!");
        $(".settings").removeClass("busy");
        progressDisplay.addClass("done");
        progressDisplay.hide();
        gp.nodeRunFinished(data); 

    });

});

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
