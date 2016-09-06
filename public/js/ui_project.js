
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

	$("#collection-chooser").on("click", function (e) {
		gp.showCollections();
		e.preventDefault();
	});

	$("#collection-prev").on("click", function (e) {
		gp.prevCollection();
	});

	$("#collection-next").on("click", function (e) {
		gp.nextCollection();
	});


	// hide/show node settings
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
	$("workspace").on('click','.run-node', function(e) {
		var node = gp.getNode(e);
		gp.runNode(node);
		e.preventDefault();
	})

	$("workspace").on('change','#field-selector', function(e) {
		gp.setVisibleFields(this);
	})

	// open project node 
	$(document).on('click','.box.node', function(e) {
		var node = gp.getNode(e);
		if(node) {
			node.open();
		}
			

		e.preventDefault();
	})

});
