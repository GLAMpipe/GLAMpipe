
var glamPipe = function () {
	var self = this;
	this.currentProject = "";
	this.currentCollectionSet = 0;
	this.currentCollection = null;
	this.currentNodes = {}; // active node per collection

	this.pickedCollectionId = "";
	
	this.projectPipeDiv = "#project-pipe";
	this.collectionSwitchDiv = "#collection-node-switch";
	this.pageTitleDiv = "#page-title";
	this.nodeHolderDiv = "node-pipe .nodeset";
	
	this.collections = [];
	this.nodes = [];

	this.login = function (username, password) {
		alert(login)
	}


	// MAIN PAGE (projects)
	this.getProjects = function (div) {
		$.getJSON("/get/project/titles", function(data) { 
			$(div).empty();
			data.sort(compare);
			for(var i = 0; i< data.length; i++) {
				var listOption = "<div data-id=" + data[i]._id + " class='wikiglyph wikiglyph-cross icon boxicon' aria-hidden='true'></div>";
				listOption += "<a href='project/" + data[i]._id + "'>\n";
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

	this.removeProject = function (event) {
		console.log("starting to remove node:", $(event.target).data("id"));
        var project_id =  $(event.target).data("id");

        $( "#dialog-confirm" ).dialog({
          resizable: false,
          height:160,
          title:"Deleting project",
          modal: true,
          buttons: {
            "Delete project": function() {
                $( this ).dialog( "close" );
                var params = {};
                $.post("/delete/project/" + project_id, params, function(retData) {
                    console.log('project deleted');
                    if(retData.error)
                        alert(retData.error);
                    else {
                        self.getProjects("#projectList");
                    }
                });
            },
            Cancel: function() {
              $( this ).dialog( "close" );
            }
          }
        });
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
						self.addProjectNode(new glamPipeNode(nodes[i], self));
					}
				}
				self.setPageTitle(project.title);
				
				// set first collection as current collection
				if(self.collections.length) {
					self.currentCollection = self.collections[self.currentCollectionSet];
					self.pickedCollectionId = self.currentCollection.source.collection; // default collection for dynamic field picker
					self.currentCollection.open();
				}
				
				self.setCollectionCounter();
				
				// render current collection set and its nodes
				self.renderCollectionSet();
			}
		})
	}


	this.addProjectNode = function (node) {
		// create separate array of collections so that we can group nodes
		if(node.source.type == "collection")
			self.collections.push(node);
		else
			self.nodes.push(node);		
	}

	this.setPageTitle = function (title) {
		$(self.pageTitleDiv).text(title);
	}



	// NODES
	
	// renders node settings and data
	this.openNode = function (e) {
		//self.renderDataHeader();
		var node = self.getNode(e);
		self.currentNodes[self.currentCollection.source.collection] = node;
		if(node)
			node.open();
		else
			alert("node id not found");
	}

	this.openCurrentNode = function () {
		self.currentNodes[self.currentCollection.source.collection].open();
	}

	this.runNode = function (e) {
		var node = self.getNode(e);
		if(node) {
			$("#node-messages").empty();
			$("#node-messages").addClass("busy");
			node.run();
		} else
			alert("node id not found");
	}

	// called by "finished" websocket message
	this.nodeRunFinished = function (data) {
		var node = self.getRegularNode(data.nodeid);
		node.runFinished();
		// self.openCurrentNode(); // we should open finished node
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

	this.getRegularNode = function (nodeid) {
		for (var i = 0; i < self.nodes.length; i++) {
			if(self.nodes[i].source._id == nodeid)
				return self.nodes[i];
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

		if (obj.data("type") == "process")
			types = ["process"]

		if (obj.data("type") == "download")
			types = ["download"]


		self.nodeRepository.renderNodeList(obj.parents(".sectiontitleblock").next(".holder"), types)
	}




	this.createNode = function (e) {
        var data = {};
        var params = {};
        var obj = $(e.target);
        // node array index
        var index = obj.data("index")
        var node = self.nodeRepository.getNodeByIndex(index);
        
        // check if are importing file 
        if(node.type == "source" && node.subtype == "file") {
			self.uploadFileAndCreateNode(obj, node);
			return;
		}
        
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
                $(".holder.params").empty();
                // point currentCollectionSet to last collection
                self.currentCollectionSet = self.collections.length;
                self.loadProject();
            });
        } else {
			// set parent collection
			if(self.currentCollection == null) 
				alert("parent collection is missing");
			else {data.collection = self.currentCollection.source.collection;
				console.log("currentCollection on node create:", self.currentCollection.source.collection);
				$.post("/create/node", data, function(returnedData) {
					console.log("node create:", returnedData);
					var node = new glamPipeNode(returnedData, self);
					self.addProjectNode(node);
					self.currentNodes[self.currentCollection.source.collection] = node;
					self.renderCollectionSet();
					node.open();
					$("data-workspace .settingscontainer .settings").show();
				});
			}
        }
	}

	this.renderDataHeader = function () {
		$("#data-header").empty().append(self.currentCollection.source.title);
	}



	// renders node boxes sorted by types (source, process etc.)
	this.renderCollectionSet = function () {
		
		var collection = self.currentCollection;
		var html = "";
		html += "<collectionset>"
		
		html += collection.renderNode();
		
		html += "  <div class='sectiontitleblock'>"
		html += "	<div><span class='title sectiontitle'>Sources</span> <a class='add-node' data-type='source' href='#'>Add</a></div>"
		html += "	<div class='wikiglyph wikiglyph-user-talk sectionicon icon' aria-hidden='true'></div>"
		html += "  </div><div class='holder params'></div>"
		 
		html += self.renderNodes(collection,["source", "lookup"]);
		  
		html += "  <div class='sectiontitleblock'>"
		html += "	<div><span class='title sectiontitle'>Processing</span> <a class='add-node' data-type='process' href='addnode.html'>Add</a></div>"
		html += "	<div class='wikiglyph wikiglyph-user-talk sectionicon icon' aria-hidden='true'></div>"
		html += "  </div><div class='holder params'></div>"
		
		html += self.renderNodes(collection, ["process"]);

		html += "  <div class='sectiontitleblock'>"
		html += "	<div><span class='title sectiontitle'>Downloads</span> <a class='add-node' data-type='download' href='addnode.html'>Add</a></div>"
		html += "	<div class='wikiglyph wikiglyph-user-talk sectionicon icon' aria-hidden='true'></div>"
		html += "  </div><div class='holder params'></div>"

		html += self.renderNodes(collection, ["download"]);
		
		html += "  <div class='sectiontitleblock'>"
		html += "	<div><span class='title sectiontitle'>Exports</span> <a class='add-node' data-type='export' href='addnode.html'>Add</a></div>"
		html += "	<div class='wikiglyph wikiglyph-user-talk sectionicon icon' aria-hidden='true'></div>"
		html += "  </div><div class='holder params'></div>"

		html += self.renderNodes(collection, ["export"]);

		html += "</collectionset>"
		
		
		$(self.nodeHolderDiv).empty();
		$(self.nodeHolderDiv).append(html);
		
	}
	
	
	
	this.renderNodes = function (collection, types) {
	
		var html = "";
		for (var i = 0; i < self.nodes.length; i++) {
			var node = self.nodes[i];
			if (node.source.collection == collection.source.collection) {
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
			self.pickedCollectionId = self.currentCollection.source.collection;
			self.renderCollectionSet();
			if(self.currentNodes[self.currentCollection.source.collection])
				self.currentNodes[self.currentCollection.source.collection].open(); 
			else
				self.currentCollection.open();
				
			console.log("currentCollection = ", self.currentCollection.source.collection);
		}
	}

	this.nextCollection = function () {
		if (self.currentCollectionSet != self.collections.length -1) {
			self.currentCollectionSet++;
			 
			self.setCollectionCounter();
			self.currentCollection = self.collections[self.currentCollectionSet];
			self.pickedCollectionId = self.currentCollection.source.collection;
			self.renderCollectionSet();
			if(self.currentNodes[self.currentCollection.source.collection])
				self.currentNodes[self.currentCollection.source.collection].open(); 
			else
				self.currentCollection.open();
								
			console.log("currentCollection = ", self.currentCollection.source.collection);
		}
	}


	this.openDynamicFieldSelector = function (event) {
		var obj = $(event.target);
		self.currentInput = obj;   // put input to global variable so that we can update it later
		
		if(self.pickedCollectionId == null)
			self.pickedCollectionId = self.currentCollection.source.collection;
		
        // fetch fields
        $.getJSON("/get/collection/" + self.pickedCollectionId + "/fields", function(data) { 
            if(data.error)
                alert(data.error);


            var html = "<ul>";
                for (var i = 0; i < data.sorted.length; i++) {
                    var key = data.keys[data.sorted[i]];
                    html += "<li class='pick_field' data-field='"+ obj.attr("name") +"' data-val='" + data.sorted[i] + "'>" + data.sorted[i] + "</li>";

                }
            html += "</ul>"
                
            
            // open dialog
            $("#dynamic-fields").empty();
            $("#dynamic-fields").append(html);
            $("#dynamic-fields").dialog({
                title: "choose field"
            });
				
			self.pickedCollectionId = null; // reset
        })
	}


	this.openDynamicCollectionSelector = function (event) {

        var obj = $(event.target);
        self.currentInput = obj; 

        
        
        
        var html = "<ul>";
        for(var i = 0; i < self.collections.length; i++) {
            var node = self.collections[i];
            if(node.source._id != self.currentCollection.source._id) {
				var parts = node.source.collection.split("_");
				if(parts[parts.length - 1] != "")
					var cName = parts[parts.length - 1];
				else
					var cName = node.source.collection;
                html += '<li class="pick_collection" data-field="source_collection" data-val="'+node.source.collection+'">' + cName + '</li>';
            }
        }
        html += "</ul>";
        
        if(self.collections.length == 1)
			html = "No other collections";

        // open dialog
        $("#dynamic-fields").empty();
        $("#dynamic-fields").append(html);
        $("#dynamic-fields").dialog({
            position: { 
                my: 'left top',
                at: 'right top',
                of: obj
            },
            title: "choose collection"
        });
	}
	
	
	this.pickField = function (event) {
        var obj = $(event.target);
        
        self.currentInput.val(obj.data("val"));
        self.currentInput.change();
        self.currentInput = null;
        
        $("#dynamic-fields").dialog("close");
	}


	this.pickCollection = function (event) {
        var obj = $(event.target);
        
        self.currentInput.val(obj.data("val"));
        self.currentInput.change();
        self.currentInput = null;
        
        // we pick fields from different collection than where we are adding the node
        self.pickedCollectionId = obj.data("val");
        
        $("#dynamic-fields").dialog("close");
	}


	this.removeNode = function (event) {
        var obj = $(event.target);
        var node_id = obj.closest(".node").data("id");
        $( "#dialog-confirm" ).dialog({
          resizable: false,
          height:160,
          title:"Deleting node",
          modal: true,
          buttons: {
            "Delete node": function() {
                $( this ).dialog( "close" );
                var params = {node:node_id, project:self.currentProject};
                $.post("/delete/node/", params, function(retData) {
                    console.log('node deleted');
                    if(retData.error)
                        alert(retData.error);
                    else {
                        self.loadProject();
                    }
                });
            },
            Cancel: function() {
              $( this ).dialog( "close" );
            }
          }
        });
	}


	this.uploadFileAndCreateNode = function (obj, node) {

        var params = {};
        
        // read params. These are send to actual node creation
        obj.parents(".holder").find("input,textarea, select").not("input[type=button],input[type=submit]").each(function(){
            params[$(this).attr("name")] = $(this).val(); 
        });

		// read form for file upload
        var form = $("#uploadfile")[0];
        var fd = new FormData(form);
        fd.append("project",self.currentProject);
        
        // upload file 
        $.ajax({
            url: "/upload/file",
            type: "POST",
            dataType: "json",
            data:  fd,
            contentType: false, 
            cache: false,
            processData:false,
            success: function(data)
            {
                if (data.error) {
                    alert(data.error);
                    $('#loading').hide();
                } else {
                    // create actual node
                    data.params = params;
                    data.params.filename = data.filename;
                    data.params.mimetype = data.mimetype;
                    data.nodeid = node.nodeid;
                    data.project = self.currentProject;
                    data.collection = self.currentCollection.source.collection; 
                    $.post("/create/node", data, function(returnedData) {
                        console.log('created upload node');
                        self.loadProject();
                    });
                }
            }	        
       });
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
