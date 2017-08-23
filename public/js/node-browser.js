
$( document ).ready(function() {

	var baseAPI = "/api/v1"; 
	var div = $(".nodeset");

	var nodeRepository = new nn();
	nodeRepository.baseAPI = baseAPI;
	nodeRepository.loadNodes(function() {
		nodeRepository.renderNodeList(div, ["process"]);
	});

	// node accordion
	$(document).on('click','.accordion', function(e) {
		this.classList.toggle("active");
		this.nextElementSibling.classList.toggle("show");
		e.preventDefault();
	})

	// open node parameters for new node
	$(document).on('click','.listoption', function(e) {
		//gp.pickedCollectionId = null;
		//console.log(gp.currentCollection.source.params.collection);
		nodeRepository.openNodeParameters(e, "");
		e.preventDefault();
	})


})
