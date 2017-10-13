

var glamPipe = function () {
	var self = this;
	this.currentProject = "";
	this.currentCollectionSet = 0;
	this.currentCollection = null;
	this.currentNodes = {}; // active node per collection
	this.currentlyOpenNode = null; // currently open node

	this.pickedCollectionId = "";
	this.baseAPI = g_apipath; 
	this.uiPath = g_uipath;
	this.desktop = true;
	
	this.projectPipeDiv = "#project-pipe";
	this.collectionSwitchDiv = "#collection-switch";
	this.collectionListDiv = "#collection-list-container";
	this.pageTitleDiv = "#page-title";
	this.nodeHolderDiv = "pipe .nodeset";
	
	this.collections = [];
	this.nodes = [];

	
	// MAIN PAGE (projects)
	this.getProjectTitles = function (div) {

		$.getJSON(self.baseAPI + "/projects/titles", function(data) { 
			$(div).empty();
			data.sort(compare);
			
			for(var i = 0; i< data.length; i++) {
				var listOption = "<div data-id=" + data[i]._id + " class='del wikiglyph wikiglyph-cross icon boxicon' aria-hidden='true'></div>";
				listOption += "<a href='" + self.uiPath + "project/" + data[i]._id + "'>\n";
				listOption += "<div class='listoption'>\n";
				listOption += "<p class='listtitle'>" + data[i].title + "</p>\n";
				//listOption += "<p class='listtext'>" + data[i].description + "</p>\n";
				listOption += "</div></a>\n";
				$(div).append(listOption);
			}
		})
	}

	this.getProjects= function (div) {

		$(".settingstitle").text("All projects");
		$.getJSON(self.baseAPI + "/projects", function(data) { 
			$(div).empty();
			//data.sort(compare);
			html = "<table><thead><tr><th>title</th><th>imports from</th><th>owner</th><th>exports to</th><th>delete</th></tr></thead>";

			for(var i = 0; i< data.length; i++) {
				html += self.genProjectRow(data[i]);
				
			}
			$(div).append("</tr>" + html + "</table>");
		})
	}

	this.getProjectsByUser = function (div, user) {
		
		$(".settingstitle").text("Projects by " + user);
		html = "<table><thead><tr><th>title</th><th>imports from</th><th>owner</th><th>exports to</th><th>delete</th></tr></thead>";
		$.getJSON(self.baseAPI +  "/collections/mp_projects/search?sort=_id&reverse=1&owner=" + user, function(data) { 
			$(div).empty();
			var projects = data.data;
			for(var i = 0; i< projects.length; i++) {
				html += "<tr><td><div><a href='" + self.uiPath + "project/" + projects[i]._id + "'> "+ projects[i].title + "</a></div></td>";

				html += "<td>";
				if(projects[i].nodes) {
					
					projects[i].nodes.forEach(function(node) {
						if(node.type === "source")
							html += "<div>" + node.title + "</div>";
					})
				}
				html += "</td>";
				
				html += "<td><div>" + projects[i].owner + "</div></td>";
				
				//html += "<td><div>";
				//if(projects[i].nodes) {
					
					//projects[i].nodes.forEach(function(node) {
						//if(node.type !== "collection")
							//html += "<li>" + node.nodeid + "</li>";
					//})
				//}
				//html += "</div></td>";
				
				html += "<td>";
				if(projects[i].nodes) {
					
					projects[i].nodes.forEach(function(node) {
						if(node.type === "export")
							html += "<div>" + node.title + "</div>";
					})
				}
				html += "</td>";
				html += "<td><div data-id='" + projects[i]._id + "' class='del button icon boxicon'>delete</div></td>";
				
				
			}
			$(div).append("</tr>" + html + "</table>");
		})
	}

	this.genProjectRow = function(project) {
			var html = "<tr><td><div><a href='project/" + project._id + "'> "+ project.title + "</a></div></td>";

			html += "<td>";
			if(project.nodes) {
				
				project.nodes.forEach(function(node) {
					if(node.type === "source")
						html += "<div>" + node.title + "</div>";
				})
			}
			html += "</td>";
			
			html += "<td><div>" + project.owner + "</div></td>";
			
			//html += "<td><div>";
			//if(project.nodes) {
				
				//project.nodes.forEach(function(node) {
				//	if(node.type !== "collection")
				//		html += "<li>" + node.nodeid + "</li>";
				//})
			//}
			//html += "</div></td>";
			
			html += "<td>";
			if(project.nodes) {
				
				project.nodes.forEach(function(node) {
					if(node.type === "export")
						html += "<div>" + node.title + "</div>";
				})
			}
			html += "</td>";
			html += "<td><div data-id='" + project._id + "' class='del button icon boxicon'>delete</div></td>";
			return html;
			
	}

	this.getUsers = function (div) {
		$.getJSON(self.baseAPI + "/collections/mp_projects/facet/owner?sort=_id", function(datal) { 
			$(div).empty();
			var data = datal.count;
			for(var i = 0; i< data.length; i++) {
				var listOption = "<div data-id=" + data[i]._id + " class='' aria-hidden='true'></div>";
				listOption += "<a data-id='" + data[i]._id + "' href='#'>\n";
				listOption += "<div class='listoption'>\n";
				listOption += "<p class='listtitle'>" + data[i]._id + " <span>("+data[i].count+")</span></p>\n";
				//listOption += "<p class='listtext'>" + data[i].description + "</p>\n";
				listOption += "</div></a>\n";
				$(div).append(listOption);
			}
			console.log(data)
		})
	}

	this.getStatus = function(div) {
		var d = {
			url: self.baseAPI + "/status", 
			method:"GET", 
			headers: {"Accept":"application/json"},
			error: function(data, s, xhr) {
				$(div).empty().append("No connection to GLAMpipe!");
			},
			success: function(data) {
				$(div).empty().append("GLAMpipe is ready...");
			}
		}
		$.ajax(d);
	}

	this.getLoginStatus = function (div, cb) {
		$.getJSON(self.baseAPI + "/config", function(config) { 
			if(config.nodedevmode)
				$("#version").empty().append("ver. " + config.version + " (devmode)");
			else
				$("#version").empty().append("ver. " + config.version);
			
			if(config.authentication === "local" || config.authentication === "shibboleth") {
				self.desktop = false;
				var d = {
					url: self.baseAPI + "/auth", 
					method:"GET", 
					headers: {"Authorization":"Bearer " + window.localStorage.getItem("token")},
					error: function(data, s, xhr) {
						console.log("not logged in");
						if(config.authentication !== "shibboleth")
							$(div).html("<div class='button' id='login-pop'>login</div> or <a href='/signup'>signup</a>");
						else
							$(div).html("no shibboleth header found!");
						if(cb)
							cb(self.desktop);
					},
					success: function(data) {
						if(config.authentication === "local") {
							self.user = data.local.email;
							$(div).html("<a id='logout' href=''>logout " + self.user + "</a>");
						} else if(config.authentication === "shibboleth") {
							if(data.shibboleth.user) {
								self.user = data.shibboleth.user;
								$(div).html("<a id='logout' href=''>logout " + self.user + "</a>");
							} else if(data.shibboleth.visitor) {
								$(div).html("visitor: " + data.shibboleth.visitor);
							}
						}

						if(cb)
							cb(self.desktop);
					}
				}
				$.ajax(d);
				
				
			} else {
					$(div).empty();
					self.desktop = true;
					$(div).html("");
					
					if(cb)
						cb(self.desktop);
			}
		})
	}	
	
	
	this.login = function(user, pass) {
		var d = {
			url:self.baseAPI + "/login", 
			type:"POST",
			data: {
				email:user,
				password:pass
			},
			error:function() {console.log("fail"), alert("login failed!")},
			success: function(data) {
				console.log(data);
				if(data.success) {
					self.user = data.user.local.email;
					window.localStorage.setItem("token", data.token);
					$("#login-popup").remove();
					$("#login").html("<a id='logout'href=''>logout " +data.user.local.email + "</a>");
					self.getProjectsByUser("#projectList", self.user);
				} else
					alert("Login failed!")
				}
		}
		$.ajax(d);

	}


	this.addProject = function (title) {

		var data = {"title": title};
		$.put(self.baseAPI + "/projects", data, function(data) {
			if(!data.error) {
				console.log('created project', data.project);
				var project = data.project._id;
				var params = {params:{title:"My collection"}}
				$.put(self.baseAPI + "/projects/" + project + "/nodes/collection_basic?type=collection", params, function(data) {
					if(!data.error)
						window.location.href = self.uiPath + "project/" + project;
					else
						alert(data.error);
				})
			} else {
				alert(data.error);
			}
		})
	}


	this.removeProject = function (event) {
		console.log("starting to remove node:", $(event.target).data("id"));
        var project_id =  $(event.target).data("id");

		$( "#dialog-confirm" ).empty().append("<div>Do want to remove the project? All data and files are lost.</div>");
        $( "#dialog-confirm" ).dialog({
          resizable: false,
          height:160,
          title:"Deleting project",
          modal: true,
          buttons: {
            "Delete project": function() {
                $( this ).dialog( "close" );
                var params = {};
                $.delete(self.baseAPI + "/projects/" + project_id, params, function(retData) {
                    console.log('project deleted');
                    if(retData.error)
                        alert(retData.error);
                    else {
						if(self.desktop)
							self.getProjects("#projectList");
						else
							self.getProjectsByUser("#projectList", self.user);
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
		this.nodeRepository.baseAPI = this.baseAPI;
		this.nodeRepository.loadNodes();
	}

	this.loadProject = function () {
		
		var path = window.location.pathname.split("/");
		self.currentProject = path[path.length - 1];
		
		self.collections = [];
		self.nodes = [];
		
		$.getJSON(self.baseAPI + "/projects/" + self.currentProject + "/nodes", function(project) { 
			
			if(typeof project !== "undefined") { 
				var nodes = project.nodes;
				
				if(nodes) {
					for(var i = 0; i< nodes.length; i++) {
						self.addProjectNode(new glamPipeNode(nodes[i], self));
					}
				}
				self.setPageTitle(project.title);
				self.project = project;
				
				// set first collection as current collection
				if(self.collections.length) {
					self.currentCollection = self.collections[self.currentCollectionSet];
					self.pickedCollectionId = self.currentCollection.source.collection; // default collection for dynamic field picker
					self.currentCollection.open();
				}
				
				self.setCollectionCounter();
				self.renderBreadCrumb();
				
				// render current collection set and its nodes
				 //$.getJSON(self.baseAPI + "/collections/" + self.currentCollection.source.collection + "/fields", function(data) {
					//self.currentCollection.fields = data; 
					self.renderCollectionSet();
				//})
				
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
		
		var node = self.getNode(e);
		self.currentlyOpenNode = node;
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
			$(".settings").addClass("busy");
			node.run();
		} else
			alert("node id not found");
	}

	this.stopNode = function (e) {
		var node = self.getNode(e);
		if(node) {
			$(".settings").removeClass("busy");
			node.stop();
		} else
			alert("node id not found");
	}

	this.debugInfo = function (e) {
		if(self.currentlyOpenNode) 
			return self.currentlyOpenNode.renderDebug();

	}

	// called by "finished" websocket message
	this.nodeRunFinished = function (data) {
		var node = self.getRegularNode(data.node_uuid);
		if(node)
			node.runFinished();
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
		console.log(obj.text())
		//obj.text("cancel");
		var types = [];
		
		if (obj.data("type") == "collection")
			types = ["collection"]
		
		if (obj.data("type") == "source")
			types = ["source"]
			
		if (obj.data("type") == "export")
			types = ["export"]

		if (obj.data("type") == "process")
			types = ["process"]

		if (obj.data("type") == "download")
			types = ["download"]

		if (obj.data("type") == "view")
			types = ["view"]

		if (obj.data("type") == "meta")
			types = ["meta"]

		self.nodeRepository.renderNodeList(obj.parents(".sectiontitleblock").next(".holder"), types)
	}




	this.createNode = function (e) {
        var data = {params:{}};
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
			if($(this).attr("type") == "checkbox") {
				if($(this).is(':checked'))
					data.params[$(this).attr("name")] = "on"; 
            } else {
				data.params[$(this).attr("name")] = $(this).val(); 
			}
        });
        
		// set parent collection
		if(self.currentCollection == null) 
			alert("parent collection is missing");
		else {data.collection = self.currentCollection.source.collection;
			console.log("currentCollection on node create:", self.currentCollection.source.collection);
			
			$.put(self.baseAPI + "/projects/" + self.currentProject + "/nodes/" + node.nodeid, data, function(returnedData) {
				console.log("node create:", returnedData);
				if(returnedData.error) {
					alert(returnedData.error);
					return;
				}
				var node = new glamPipeNode(returnedData.node, self);
				self.addProjectNode(node);
				self.currentNodes[self.currentCollection.source.collection] = node;
				self.currentlyOpenNode = node;
				self.renderCollectionSet();
				node.open();
				$("data-workspace settingscontainer .settings").show();
				$("data-workspace settingscontainer submitblock").show();
				$("data-workspace settingscontainer .node-description").show();
			});
		}
	}

	this.createCollection = function (e) {
		$( "#dialog-confirm").empty().append("<label>collection name</label><input value='new collection'/>");
        $( "#dialog-confirm").dialog({
          resizable: false,
          height:160,
          title:"Add collection ",
          modal: true,
          buttons: {
            "Add": function() {
                $( this ).dialog( "close" );
				var title = $( "#dialog-confirm input").val();
				var data = {"params":{"title":title}};
				$.put(self.baseAPI + "/projects/" + self.currentProject + "/nodes/collection_basic?type=collection", data, function(returnedData) {
					console.log('created node');
					$(".holder.params").empty();
					// point currentCollectionSet to last collection
					self.currentCollectionSet = self.collections.length;
					self.loadProject();
				}); 
            },
            Cancel: function() {
              $( this ).dialog( "close" );
            }
          }
        });
       

	}
 

	this.renderDataHeader = function () {
		$("#data-header").empty().append(self.currentCollection.source.title);
	}

	this.renderBreadCrumb = function () {
		if(self.currentCollection)
			$("pipe .breadcrumbblock .boxtag").empty().append(self.project.title + " > " + self.currentCollection.source.title);
		else
			$("pipe .breadcrumbblock .boxtag").empty().append(self.project.title + " > ");
	}

	// renders node boxes sorted by types (source, process etc.)
	this.renderCollectionSet = function () {
		
		if(!self.currentCollection)
			return "";
		
		$.getJSON(self.baseAPI + "/collections/" + self.currentCollection.source.collection + "/fields", function(data) {
			self.currentCollection.fields = data; 

			if(self.currentCollection) {
				var collection = self.currentCollection;
				
				// render collection
				var col_html =   "<div><span class='title pagetitle'>" + collection.source.title + "</span>";
				col_html += "<a class='add-collection' href='#'> Add </a>";
				col_html += "<a class='remove-collection' href='#' data-id='"+collection.source._id+"'> Remove</a></div>";
				
				//col_html += "<div class='boxtext'>This is the description of the dataset</div>";
				$("pipe .collection").empty().append(col_html);

				var html = "";
				html += "<collectionset>"

				html += "  <div class='sectiontitleblock'>"
				html += "	<div><span class='title sectiontitle'>Data imports</span> <a class='add-node' data-type='source' href='#'>Add</a></div>"
				html += "	<div title='help' class='wikiglyph wikiglyph-user-talk sectionicon icon' aria-hidden='true'></div>"
				html += "  </div><div class='holder params'></div>"
				 
				html += self.renderNodes(collection,["source"]);
				  
				html += "  <div class='sectiontitleblock'>"
				html += "	<div><span class='title sectiontitle'>Operations</span> <a class='add-node' data-type='process' href='addnode.html'>Add</a></div>"
				html += "	<div class='wikiglyph wikiglyph-user-talk sectionicon icon' aria-hidden='true'></div>"
				html += "  </div><div class='holder params'></div>"

				html += self.renderNodes(collection, ["process"]);
				
				html += "  <div class='sectiontitleblock'>"
				html += "	<div><span class='title sectiontitle'>Exports</span> <a class='add-node' data-type='export' href='addnode.html'>Add</a></div>"
				html += "	<div class='wikiglyph wikiglyph-user-talk sectionicon icon' aria-hidden='true'></div>"
				html += "  </div><div class='holder params'></div>"

				html += self.renderNodes(collection, ["export"]);

				html += "  <div class='sectiontitleblock'>"
				html += "	<div><span class='title sectiontitle'>Views</span> <a class='add-node' data-type='view' href='addnode.html'>Add</a></div>"
				html += "	<div class='wikiglyph wikiglyph-user-talk sectionicon icon' aria-hidden='true'></div>"
				html += "  </div><div class='holder params'></div>"

				html += self.renderNodes(collection, ["view"]);

				//html += "  <div class='sectiontitleblock'>"
				//html += "	<div><span class='title sectiontitle'>Tasks</span> <a class='add-node' data-type='meta' href='addnode.html'>Add</a></div>"
				//html += "	<div class='wikiglyph wikiglyph-user-talk sectionicon icon' aria-hidden='true'></div>"
				//html += "  </div><div class='holder params'></div>"

				//html += self.renderNodes(collection, ["meta"]);
			}
			html += "</collectionset>"
			
			
			$(self.nodeHolderDiv).empty();
			$(self.nodeHolderDiv).append(html);
				
			
		})
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
		//console.log(self.collections);
		$(self.collectionListDiv).empty()
		console.log(self.collections.length);
		for (var i = 0; i < self.collections.length; i++) {
			var title = "no title";
			if(self.collections[i].source.title !== "")
				title = self.collections[i].source.title;
			$(self.collectionListDiv).append("<div class='collection-item' data-index='"+i+"'>" + title + "</div");
		}
		$(self.collectionListDiv).append("<div class='add-collection'><a href='#'>add collection</a></div");
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
			self.renderBreadCrumb();
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
			self.renderBreadCrumb();
			self.renderCollectionSet();
			if(self.currentNodes[self.currentCollection.source.collection])
				self.currentNodes[self.currentCollection.source.collection].open(); 
			else
				self.currentCollection.open();
								
			console.log("currentCollection = ", self.currentCollection.source.collection);
		}
	}

	this.chooseCollection = function(index) {
		self.currentCollectionSet = parseInt(index)
		self.setCollectionCounter();
		self.currentCollection = self.collections[self.currentCollectionSet];
		self.pickedCollectionId = self.currentCollection.source.collection;
		self.renderBreadCrumb();
		self.renderCollectionSet();
		if(self.currentNodes[self.currentCollection.source.collection])
			self.currentNodes[self.currentCollection.source.collection].open(); 
		else
			self.currentCollection.open();
							
		console.log("currentCollection = ", self.currentCollection.source.collection);
	}

	this.updateDocument = function (data, cb) {
		post(self.baseAPI + "/collections/" + self.currentCollection.source.collection + "/docs/" + data.doc_id, data, function( response ) {
			console.log(response);
			cb();
		})
	}

	this.deleteDocument = function(event) {
		var doc_id = $(event.target).data("id");
		console.log(self.currentCollection.source);
		$( "#dialog-confirm" ).empty().append("<div>Are you sure?</div>");
        $( "#dialog-confirm" ).dialog({
          resizable: false,
          height:160,
          title:"Deleting document " + doc_id,
          modal: true,
          buttons: {
            "Delete document": function() {
                $( this ).dialog( "close" );
                var params = {};
                $.delete(self.baseAPI + "/collections/" + self.currentCollection.source.collection + "/docs/" + doc_id, params, function(retData) {
                    console.log('document deleted');
                    if(retData.error)
                        alert(retData.error);
                    else {
						$(event.target).parents("tr").remove();                        
                    }
                });
            },
            Cancel: function() {
              $( this ).dialog( "close" );
            }
          }
        });
	}

	this.openDynamicFieldSelector = function (event, source) {
		var obj = $(event.target);
		self.currentInput = obj;   // put input to global variable so that we can update it later
		
		var collection = self.pickedCollectionId;
		console.log(source)
		console.log(self.currentCollection.source.collection);
		
		if(self.pickedCollectionId == null && source) {
			alert("You must choose collection first!")
			return;
		} else if(!source) {
			collection = self.currentCollection.source.collection;
		} 
		
        // fetch fields
        $.getJSON(self.baseAPI + "/collections/" + collection + "/fields", function(data) { 
            if(data.error)
                alert(data.error);


            var html = "<ul>";
                for (var i = 0; i < data.sorted.length; i++) {
                    var key = data.keys[data.sorted[i]];
                    html += "<li class='pick_field' data-field='"+ obj.attr("name") +"' data-val='" + data.sorted[i] + "'>" + data.sorted[i] + "</li>";

                }
            html += "</ul>"
            
            // add select
            html = "<select>";
                
                for (var i = 0; i < data.sorted.length; i++) {
                    var key = data.keys[data.sorted[i]];
                    html += "<option class='pick_field' data-field='"+ obj.attr("name") +"' data-val='" + data.sorted[i] + "'>" + data.sorted[i] + "</option>";

                }
            html += "</select>";  
            
                      
            // open dialog
            $("#dynamic-fields").empty();
            $("#dynamic-fields").append(html);
            $("#dynamic-fields").dialog({
                title: "choose field"
            });
				
			//self.pickedCollectionId = null; // reset
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

	this.saveNodeDescription = function(desc) {
		self.currentlyOpenNode.saveDescription(desc);
	}

	// node id comes from DOM attribute
	this.removeNode = function (event, nodeid) {
        var obj = $(event.target);
		if(typeof nodeid === "undefined")
			var node_id = obj.closest(".node").data("id");
		else
			var node_id = nodeid;
		
        $( "#dialog-confirm" ).empty().append("<div>Do you want to remove node?</div>");
        $( "#dialog-confirm" ).dialog({
          resizable: false,
          height:160,
          title:"Deleting node",
          modal: true,
          buttons: {
            "Delete node": function() {
                $( this ).dialog( "close" );
                var params = {node:node_id, project:self.currentProject};
                $.delete(self.baseAPI + "/projects/" + self.currentProject + "/nodes/" + node_id, params, function(retData) {
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
            url: self.baseAPI + "/upload",
            type: "POST",
            dataType: "json",
            data:  fd,
            contentType: false, 
            cache: false,
            processData:false,
            headers: {"Authorization": "Bearer " + localStorage.getItem("token")},
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
                    data.project = self.currentProject;
                    data.collection = self.currentCollection.source.collection; 
                    $.put(self.baseAPI + "/projects/" + self.currentProject + "/nodes/" + node.nodeid, data, function(returnedData) {
                        console.log('created upload node');
                        self.loadProject();
                    });
                }
            }	        
       });
	}

}




$.delete = function(url, data, callback, type){
 
  if ( $.isFunction(data) ){
    type = type || callback,
        callback = data,
        data = {}
  }
 
  return $.ajax({
    url: url,
    type: 'DELETE',
    success: callback,
    data: data,
    contentType: type,
    headers: {"Authorization": "Bearer " + localStorage.getItem("token")}
  }).fail(function(jqXHR, textStatus, errorThrown ) {
		if(errorThrown === "Unauthorized")
			alert("You are not logged in or you are not the owner of the project!")
		else
			alert(errorThrown)
	});
}


post = function(url, data, callback, type){
 
  if ( $.isFunction(data) ){
    type = type || callback,
    callback = data,
    data = {}
  }
  
  return $.ajax({
    url: url,
    type: 'POST',
    data: data,
    success:callback,
    contentType: type,
    headers: {"Authorization": "Bearer " + localStorage.getItem("token")}, function(){alert("pat")}
  }).fail(function(jqXHR, textStatus, errorThrown ) {
		if(errorThrown === "Unauthorized")
			alert("You are not logged in or you are not the owner of the project!")
		else
			alert(errorThrown)
	});
}

$.put = function(url, data, callback, type){
 
  if ( $.isFunction(data) ){
    type = type || callback,
    callback = data,
    data = {}
  }
  
  return $.ajax({
    url: url,
    type: 'PUT',
    data: data,
    success:callback,
    contentType: type,
    headers: {"Authorization": "Bearer " + localStorage.getItem("token")}, function(){alert("pat")}
  }).fail(function(jqXHR, textStatus, errorThrown ) {
		if(errorThrown === "Unauthorized")
			alert("You are not logged in or you are not the owner of the project!")
		else
			alert(errorThrown)
	});
}


function compare(a,b) {
  if (a.last_nom < b.last_nom)
	return -1;
  else if (a.last_nom > b.last_nom)
	return 1;
  else 
	return 0;
}
