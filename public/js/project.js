
var nodeList = function () {
	var self = this;

	this.collection = ko.observableArray(); // Initial items
	this.projectNodes = ko.observableArray(); 

	this.loadProject = function (nodesModel) {
		$.getJSON("/get/nodes/" + self.currentProject, function(project) { 
			var data = project.nodes;
			if(typeof data !== "undefined") { 
				for(var i = 0; i< data.length; i++) {
					var d = data[i];
					self.projectNodes.push(data[i]);
				}
			}
			$("#project_title").text(project.title);
			
		})
	}

	this.loadNodes = function (nodesModel) {
		$.getJSON("/get/nodes", function(data) { 
			for(var i = 0; i< data.length; i++) {
				var d = data[i];
				for(var j = 0; j < data[i].subtypes.length; j++) {
					for(var k = 0; k < data[i].subtypes[j].nodes.length; k++) {
						//data[i].subtypes[j].nodes[k].params = self.generateParams(data[i].subtypes[j].nodes[k]);
					}
				}
				
				self.collection.push(data[i]);
			}
		})
	}

}

$( document ).ready(function() {
	nodes = new nodeList();
	var path = window.location.pathname.split("/");
	nodes.currentProject = path[path.length - 1];
	ko.applyBindings(nodes);
	//nodes.loadNodes(nodes);
	nodes.loadProject(nodes);
	
	var docs = new dataList();
	docs.collectionName = path[path.length -1];
	ko.applyBindings(docs);
	nodes.loadData(docs);


});
