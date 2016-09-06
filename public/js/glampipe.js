
var glamPipe = function () {
	var self = this;
	this.currentProject = ""
	this.currentCollectionSet = 0
	this.currentNodes = []
	
	this.projectPipeDiv = "#project-pipe"
	this.collectionSwitchDiv = "#collection-node-switch"
	this.pageTitleDiv = "#page-title",
	
	this.collections = []
	this.nodes = []
	this.sources = []
	this.transforms = []
	this.exports = []
	this.collectionSets = []

	this.data = new dataHolder()

	this.loadData = function (node) {
		self.currentNodes[self.currentCollectionSet] = node;
		self.data.getAndRenderData(self.collections[0]);
	}

	this.renderData = function () {
		if(self.data.length != 0)
			self.data.loadData(self.collections[0]);
		else
			self.data.render();
	}

	this.login = function (username, password) {
		alert(login)
	}

	this.setVisibleFields = function (opt) {
		$("#selected_fields").append("<button> "+ opt.value + "</button>");	
		self.currentNodes[self.currentCollectionSet].visible_keys.push(opt.value);
		self.data.getAndRenderData(self.collections[0]);
	}

	// render node settings and execute its settings.js
	this.openSettings = function (node) {
		
		self.currentNodes[self.currentCollectionSet] = node;
		
		$("workspace .settingstitle").text("Settings for " + node.title);
		$("workspace .settings").empty();
		$("workspace .settings").append(node.views.settings);
		
		if(node.scripts.settings) {
			var settingsScript = new Function('node', node.scripts.settings);
			settingsScript(node);
		}
		
		$("workspace .settings").append("<div class='box'><button class='run-node' data-id='"+node._id+"'>run</button></div>");
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
		if ($(".create_project #title").val().trim() == "")
			alert("Please give a title for the project!");
		else {
			var title = $(".create_project #title").val().trim();
			var data = {"title": title};
			$.post("/create/project", data, function(returnedData) {
				if(!returnedData.error) {
					console.log('created project', returnedData.project);
					window.location.href = "/project/" + returnedData.project._id;
				} else {
					alert(returnedData.error);
				}
			});
		}
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
				if(nodes) {
					for(var i = 0; i< nodes.length; i++) {
						
						var node = new glamPipeNode(nodes[i]);
						// extra properties TODO: make node object properly
						nodes[i].settings = {};
						nodes[i].visible_keys = [];
						
						// create separate array of collections so that we can group nodes
						if(nodes[i].type == "collection")
							self.collections.push(node);
						else
							self.nodes.push(node);

					}
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
		//for (var i = 0; i < self.collections.length; i++) {
			//self.collectionSets.push(self.renderCollectionSet())
			//$("pipe").append(self.renderCollectionSet(i, self.collections[i]));
		//}
		$("pipe").append(self.renderCollectionSet(0, self.collections[0]));
		//self.currentCollectionSet
		// hide other collection except the first one
		//$("collectionset").hide();
		//$("collectionset[id='set0']").show();

	}


	this.renderCollectionSet = function (count, collection) {
		var html = "";
		html += "<collectionset id='set"+count+"'>"
		
		html += collection.renderNode();
		
		html += "  <div class='sectiontitleblock'>"
		html += "	<div><span class='title sectiontitle'>Source</span> <a class='add-node' data-type='source' href='#'>Add</a></div>"
		html += "	<div class='wikiglyph wikiglyph-user-talk sectionicon icon' aria-hidden='true'></div>"
		html += "  </div><div class='holder'></div>"
		 
		html += self.renderNodes(collection.sources);
		  
		html += "  <div class='sectiontitleblock'>"
		html += "	<div><span class='title sectiontitle'>Process</span> <a class='add-node' data-type='transform' href='addnode.html'>Add</a></div>"
		html += "	<div class='wikiglyph wikiglyph-user-talk sectionicon icon' aria-hidden='true'></div>"
		html += "  </div><div class='holder'></div>"
		
		html += self.renderNodes(collection.transforms);
		
		html += "  <div class='sectiontitleblock'>"
		html += "	<div><span class='title sectiontitle'>Export</span> <a class='add-node' data-type='export' href='addnode.html'>Add</a></div>"
		html += "	<div class='wikiglyph wikiglyph-user-talk sectionicon icon' aria-hidden='true'></div>"
		html += "  </div><div class='holder'></div>"

		html += self.renderNodes(collection.exports);

		html += "</collectionset>"
		
		return html;
		
	}
	
	this.renderNodes = function (nodes) {
		
		var html = "";
		for (var i = 0; i < nodes.length; i++) {
			html += nodes[i].renderNode();
		}
		return html;
		
	}

	this.getNode = function (clickEvent) {
		var nodeid = $(clickEvent.target).data("id");

		if(nodeid == null) 
			nodeid = $(clickEvent.target).closest(".node").data("id");
			
		// find from regular ndes
		for (var i = 0; i < self.nodes.length; i++) {
			if(self.nodes[i]._id == nodeid)
				return self.nodes[i];
			
		}
		// find from collections
		for (var i = 0; i < self.collections.length; i++) {
			if(self.collections[i]._id == nodeid)
				return self.collections[i];
			
		}		
		return null;
	}


	this.renderProjectNode = function (node) {
		var html = "<div class='box node " + node.type + "' data-id='" + node._id + "'>"
		html +=   "  <div class='boxleft'>"
		html +=   "    <div class='boxtag'>" + node.type + " > " + node.subtype + "</div>"
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
        var node = self.nodeRepository.getNodeByIndex(index);
        
        // read params
        obj.parents(".holder").find("input,textarea, select").not("input[type=button]").each(function(){
            params[$(this).attr("name")] = $(this).val(); 
        });
        
        data.params = params;
        data.nodeid= node.nodeid;
        data.project = self.currentProject;

        if(node.type == "collection") {
            $.post("/create/collection/node", data, function(returnedData) {
                console.log('created node');
                $("#node_creator").hide();
                //nodes.reloadProject();
            });
        } else {
            data.collection = self.collections[self.currentCollectionSet].collection;
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
