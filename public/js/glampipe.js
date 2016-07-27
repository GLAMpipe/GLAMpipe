
var glamPipe = function () {
	var self = this;
	this.currentProject = "575ee8fa045443e80d097a8d"
	this.currentCollectionSet = 0
	
	this.projectPipeDiv = "#project-pipe"
	this.collectionSwitchDiv = "#collection-node-switch"
	this.pageTitleDiv = "#page-title",
	
	this.collections = []
	this.nodes = []
	this.sources = []
	this.transforms = []
	this.exports = []
	this.collectionSets = []
	
	
	this.login = function (username, password) {
		alert(login)
	}
	
	
	this.getProjects = function (div) {
		$.getJSON("/get/project/titles", function(data) { 
			data.sort(compare);
			for(var i = 0; i< data.length; i++) {
				var listOption = "<a href='project/" + data[i]._id + "'>\n";
				listOption += "<div class='listoption'>\n";
				listOption += "<p class='listtitle'>" + data[i].title + "</p>\n";
				//listOption += "<p class='listtext'>" + data[i].description + "</p>\n";
				listOption += "</div></a>\n";
				$(div).append(listOption);
			}
		})
	}
	
	
	
	this.addProject = function (projectName) {
		alert("not implemented!");
	}
	
	this.loadNodes = function() {
		this.nodeRepository = new nodeRepository();
		this.nodeRepository.loadNodes();
	}

	this.loadProject = function (nodesModel) {
		
		var path = window.location.pathname.split("/");
		self.currentProject = path[path.length - 1];
		
		$.getJSON("/get/nodes/" + self.currentProject, function(project) { 
			if(typeof project !== "undefined") { 
				var nodes = project.nodes;
				for(var i = 0; i< nodes.length; i++) {
					var d = nodes[i];
					// create separate array of collections so that we can group nodes
					if(nodes[i].type == "collection")
						self.collections.push(nodes[i]);
					else
						self.nodes.push(nodes[i]);

				}
				self.setPageTitle(project.title);
				self.sortNodes();
				self.renderProjectNodes();
			}
		})
	}

	this.setPageTitle = function (title) {
		$(self.pageTitleDiv).text(title);
	}

	this.sortNodes = function () {
		// nodes are orgnised by collection
		for (var i = 0; i < self.collections.length; i++) {
			var collection = self.collections[i];
			collection.sources = [];
			collection.transforms = [];
			collection.exports = [];
			collection.nodes = [];
			
			for (var j = 0; j < self.nodes.length; j++) {
				var node = self.nodes[j];
				if (node.collection == collection.collection) {
					
					if(node.type == "source")
						collection.sources.push(node);

					else if(node.type == "transform")
						collection.transforms.push(node);
						
					else if(node.type == "export" || node.type == "upload")
						collection.exports.push(node);
						
					else
						collection.nodes.push(node);
				}
			}
		}
	}
	
	this.renderProjectNodes = function () {
		// set collection counter/switcher
		self.setCollectionCounter();
		
		// nodes are orgnised by collection
		for (var i = 0; i < self.collections.length; i++) {
			//self.collectionSets.push(self.renderCollectionSet())
			$("pipe").append(self.renderCollectionSet(i, self.collections[i]));
		}
		
		// hide other collection except the first one
		$("collectionset").hide();
		$("collectionset[id='set0']").show();

	}


	this.renderCollectionSet = function (count, collection) {
		var html = "";
		html += "<collectionset id='set"+count+"'>"
		
		html += self.renderProjectNode(collection);
		
		html += "  <div class='sectiontitleblock'>"
		html += "	<div><span class='title sectiontitle'>Sources and lookups</span> <a class='add-node' data-type='source' href='#'>Add source</a></div>"
		html += "	<div class='wikiglyph wikiglyph-user-talk sectionicon icon' aria-hidden='true'></div>"
		html += "  </div><div class='holder'></div>"
		 
		html += self.renderNodes(collection.sources);
		  
		html += "  <div class='sectiontitleblock'>"
		html += "	<div><span class='title sectiontitle'>Transforms and others</span> <a class='add-node' data-type='transform' href='addnode.html'>Add transform</a></div>"
		html += "	<div class='wikiglyph wikiglyph-user-talk sectionicon icon' aria-hidden='true'></div>"
		html += "  </div><div class='holder'></div>"
		
		html += self.renderNodes(collection.transforms);
		
		html += "  <div class='sectiontitleblock'>"
		html += "	<div><span class='title sectiontitle'>Exports and uploads</span> <a class='add-node' data-type='export' href='addnode.html'>Add export</a></div>"
		html += "	<div class='wikiglyph wikiglyph-user-talk sectionicon icon' aria-hidden='true'></div>"
		html += "  </div><div class='holder'></div>"

		html += self.renderNodes(collection.exports);

		html += "</collectionset>"
		
		return html;
		
	}
	
	this.renderNodes = function (nodes) {
		
		var html = "";
		for (var i = 0; i < nodes.length; i++) {
			html += self.renderProjectNode(nodes[i]);
		}
		return html;
		
	}


	this.renderProjectNode = function (node) {
		var html = "<div class='box " + node.type + "'>"
		html +=   "  <div class='boxleft'>"
		html +=   "    <div class='boxtag'>" + node.type + "</div>"
		html +=   "    <div class='title boxtitle'>"+node.title+"</div>"
		html +=   "    <div class='boxtext'>" + node.description + "</div>"
		html +=   "  </div>"
		html +=   "  <div class='wikiglyph wikiglyph-cross icon boxicon' aria-hidden='true'></div>"
		html +=   "</div>"
		return html;
	}
	
	this.setCollectionCounter  = function () {
		$(self.collectionSwitchDiv).text((self.currentCollectionSet + 1) + " / " + self.collections.length)
	}
	
	this.showCollections = function () {
		alert("not implemented");
	}

	this.prevCollection = function () {
		if (self.currentCollectionSet != 0) {
			$("collectionset").hide();
			self.currentCollectionSet-- 
			self.setCollectionCounter();
			$("collectionset[id='set"+self.currentCollectionSet+"']").show();
		}
	}

	this.nextCollection = function () {
		if (self.currentCollectionSet != self.collections.length -1) {
			$("collectionset").hide();
			self.currentCollectionSet++ 
			self.setCollectionCounter();
			$("collectionset[id='set"+self.currentCollectionSet+"']").show();
		}
	}
	
	this.showNodeList = function (e) {
		var obj = $(e.target);
		var types = [];
		
		if (obj.data("type") == "collection")
			types = ["collection"]
		
		if (obj.data("type") == "source")
			types = ["source", "lookup"]
			
			
		if (obj.data("type") == "export")
			types = ["export", "upload"]

		if (obj.data("type") == "transform")
			types = ["transform"]

		self.nodeRepository.renderNodeList(obj.parents(".sectiontitleblock").next(".holder"), types)
	}

	this.createNode = function (e) {
        var data = {};
        var params = {};
        var obj = $(e.target);
        // node array index
        var index = obj.data("index")
        var collection = self.collections[self.currentCollectionSet]._id;
        var node = self.nodeRepository.getNodeByIndex(index);
        alert(node.id)
        
        // read params
        obj.parents(".holder").find("input,textarea, select").not("input[type=button]").each(function(){
            params[$(this).attr("name")] = $(this).val(); 
        });
        
        data.params = params;
        data.nodeid= node.nodeid;
        data.project = self.currentProject;
        //data.input_node = nodes.currentNode; 

        if(node.type == "collection") {
            $.post("/create/collection/node", data, function(returnedData) {
                console.log('created node');
                $("#node_creator").hide();
                //nodes.reloadProject();
            });
        } else {
            data.collection = collection;
            $.post("/create/node", data, function(returnedData) {
                console.log('created node');
                $("#node_creator").hide();
                self.loadProject();
            });
        }
	}

}



function compare(a,b) {
  if (a.last_nom < b.last_nom)
	return -1;
  else if (a.last_nom > b.last_nom)
	return 1;
  else 
	return 0;
}
