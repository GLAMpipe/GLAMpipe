
$( document ).ready(function() {
	
	var gp = new glamPipe();
	gp.loadNodes()
	
	gp.loadProject("#projectList");

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



	// create node
	$(document).on('click','.box.collection', function(e) {
		gp.loadData();
		e.preventDefault();
	})

});
