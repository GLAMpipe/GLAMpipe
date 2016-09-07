
$( document ).ready(function() {
	
	var gp = new glamPipe();
	gp.loadNodes()
	
	gp.loadProject("#projectList");

	// hide node settings panel on start
	$("workspace .settings").hide();
	$("workspace .settingscontainer").hide();

	$("#create_project").on("click", function (e) {
		gp.addProject("pam");
	});


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
		$("workspace .settings").hide();
	});

	$(".settingscontainer").on("click", ".wikiglyph-caret-down", function (e) {
		$(this).removeClass("wikiglyph-caret-down");
		$(this).addClass("wikiglyph-caret-up");
		$("workspace .settings").show();
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

	// open node settings on new node
	$(document).on('click','.listoption', function(e) {
		gp.nodeRepository.openNodeSettings(e);
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


});
