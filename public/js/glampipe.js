
var glamPipe = function () {
	var self = this;
	this.currentProject = ""
	this.currentCollectionSet = 0;
	this.currentCollection = null;
	this.currentNodes = []
	
	this.projectPipeDiv = "#project-pipe"
	this.collectionSwitchDiv = "#collection-node-switch"
	this.pageTitleDiv = "#page-title",
	
	this.collections = []
	this.nodes = []

	this.login = function (username, password) {
		alert(login)
	}


	// MAIN PAGE (projects)
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


	// PROJECT
	
	
	// loads node repository
	this.loadNodes = function() {
		this.nodeRepository = new nodeRepository();
		this.nodeRepository.loadNodes();
	}

	this.loadProject = function () {
		
		var path = window.location.pathname.split("/");
		self.currentProject = path[path.length - 1];
		
		self.collections = [];
		self.nodes = [];
		
		$.getJSON("/get/nodes/" + self.currentProject, function(project) { 
			if(typeof project !== "undefined") { 
				var nodes = project.nodes;
				if(nodes) {
					for(var i = 0; i< nodes.length; i++) {
						
						var node = new glamPipeNode(nodes[i]);
						
						// create separate array of collections so that we can group nodes
						if(nodes[i].type == "collection")
							self.collections.push(node);
						else
							self.nodes.push(node);

					}
				}
				self.setPageTitle(project.title);
				
				// set first collection as current collection
				if(self.collections.length) {
					self.currentCollection = self.collections[self.currentCollectionSet];
				}
				
				self.setCollectionCounter();
				
				// render current collection set and its nodes
				self.renderCollectionSet();
			}
		})
	}

	this.setPageTitle = function (title) {
		$(self.pageTitleDiv).text(title);
	}



	// NODES
	this.openNode = function (e) {
		var node = self.getNode(e);
		if(node)
			node.open();
		else
			alert("node id not found");
	}

	this.runNode = function (e) {
		var node = self.getNode(e);
		if(node)
			node.run();
		else
			alert("node id not found");
	}


	this.getNode = function (clickEvent) {
		var nodeid = $(clickEvent.target).data("id");

		if(nodeid == null) 
			nodeid = $(clickEvent.target).closest(".node").data("id");
			
		// find from regular nodes
		for (var i = 0; i < self.nodes.length; i++) {
			if(self.nodes[i].source._id == nodeid)
				return self.nodes[i];
			
		}
		// find from collections
		for (var i = 0; i < self.collections.length; i++) {
			if(self.collections[i].source._id == nodeid)
				return self.collections[i];
			
		}		
		return null;
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
                // point currentCollectionSet to last collection
                self.currentCollectionSet = self.collections.length;
                self.loadProject();
            });
        } else {
			// set parent collection
			if(self.currentCollection == null) 
				alert("parent collection is missing");
			else {data.collection = self.currentCollection.source._id;
				$.post("/create/node", data, function(returnedData) {
					console.log('created node');
					$("#node_creator").hide();
					//self.addNode();
				});
			}
        }
	}



	this.removeNode = function (event) {
        var obj = $(event.target);
        console.log("remove node");
        $( "#dialog-confirm" ).dialog({
          resizable: false,
          height:160,
          modal: true,
          buttons: {
            "Delete node": function() {
                $( this ).dialog( "close" );
                var params = {node:data._id, project:self.currentProject};
                $.post("/delete/node/", params, function(retData) {
                    console.log('node deleted');
                    if(retData.error)
                        alert(retData.error);
                    else {
                        self.resetSettings();
                        self.currentNode = null;
                        self.currentCollection = null;
                        self.currentNodePosition = null;
                        self.reloadProject();
                    }
                });
            },
            Cancel: function() {
              $( this ).dialog( "close" );
            }
          }
        });
	}

	// renders node boxes sorted by types (source, process etc.)
	this.renderCollectionSet = function () {
		
		console.log("rendering collection ", self.currentCollection.source._id);
		
		var collection = self.currentCollection;
		var html = "";
		html += "<collectionset>"
		
		html += collection.renderNode();
		
		html += "  <div class='sectiontitleblock'>"
		html += "	<div><span class='title sectiontitle'>Source</span> <a class='add-node' data-type='source' href='#'>Add</a></div>"
		html += "	<div class='wikiglyph wikiglyph-user-talk sectionicon icon' aria-hidden='true'></div>"
		html += "  </div><div class='holder'></div>"
		 
		html += self.renderNodes(collection,["source", "lookup"]);
		  
		html += "  <div class='sectiontitleblock'>"
		html += "	<div><span class='title sectiontitle'>Process</span> <a class='add-node' data-type='transform' href='addnode.html'>Add</a></div>"
		html += "	<div class='wikiglyph wikiglyph-user-talk sectionicon icon' aria-hidden='true'></div>"
		html += "  </div><div class='holder'></div>"
		
		html += self.renderNodes(collection, ["transform"]);
		
		html += "  <div class='sectiontitleblock'>"
		html += "	<div><span class='title sectiontitle'>Export</span> <a class='add-node' data-type='export' href='addnode.html'>Add</a></div>"
		html += "	<div class='wikiglyph wikiglyph-user-talk sectionicon icon' aria-hidden='true'></div>"
		html += "  </div><div class='holder'></div>"

		html += self.renderNodes(collection, ["export"]);

		html += "</collectionset>"
		
		
		$("pipe .holder").empty();
		$("pipe .holder").append(html);
		
	}
	
	
	
	this.renderNodes = function (collection, types) {
	
		var html = "";
		for (var i = 0; i < self.nodes.length; i++) {
			var node = self.nodes[i];
			if (node.source.collection == collection.source._id) {
				if(types.indexOf(node.source.type) != -1)
					html += node.renderNode();
			}
		}
		return html;
	}


	// COLLECTION CHOOSER
	this.showCollections = function (e) {
		console.log(self.collections);
		
		//var obj = $(e.target).parent();
		//for (var i = 0; i < self.collections.length; i++) {
			//obj.append("<div class='col_choose'>collection:" + self.collections[i].source.title + "</div");
		//}
	}

	
	this.setCollectionCounter  = function () {
		$(self.collectionSwitchDiv).text((self.currentCollectionSet + 1) + " / " + self.collections.length)
	}
	
	
	this.prevCollection = function () {
		if (self.currentCollectionSet != 0) {
			self.currentCollectionSet--;
			
			self.setCollectionCounter();
			self.currentCollection = self.collections[self.currentCollectionSet]; 
			self.renderCollectionSet();
		}
	}

	this.nextCollection = function () {
		if (self.currentCollectionSet != self.collections.length -1) {
			self.currentCollectionSet++;
			 
			self.setCollectionCounter();
			self.currentCollection = self.collections[self.currentCollectionSet];
			self.renderCollectionSet();
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
