

function compare(a,b) {
  if (a.last_nom < b.last_nom)
    return -1;
  else if (a.last_nom > b.last_nom)
    return 1;
  else 
    return 0;
}


var nodeList = function () {
	var self = this;

	this.collection = ko.observableArray(); 
	this.projectNodes = ko.observableArray(); 
	this.projectCollections = ko.observableArray(); 
	this.documents = ko.observableArray(); 

    // get project nodes
	this.loadProject = function (nodesModel) {

		$.getJSON("/get/nodes/" + self.currentProject, function(project) { 
			var data = project.nodes;
			if(typeof data !== "undefined") { 
				for(var i = 0; i< data.length; i++) {
					var d = data[i];
                    // create separate array of collections so that we can group nodes
                    if(data[i].type == "collection")
                        self.projectCollections.push(data[i]);
                        
                    self.projectNodes.push(data[i]);
				}
			}
			$("#project_title").text(project.title);
		})
	}

    // get all nodes
	this.loadNodes = function (nodesModel) {
		$.getJSON("/get/nodes", function(data) { 
			for(var i = 0; i< data.length; i++) {
				var d = data[i];
				for(var j = 0; j < data[i].subtypes.length; j++) {
					for(var k = 0; k < data[i].subtypes[j].nodes.length; k++) {
						data[i].subtypes[j].nodes[k].params = self.generateParams(data[i].subtypes[j].nodes[k]);
					}
				}
				
				self.collection.push(data[i]);
			}
		})
	}

    // shows only source nodes and set current node, collection and position
    this.openSourceCreator = function(data, event) {
        //self.selectNode(data, event);
        var obj = $(event.target);
        $("#node_creator > div").hide();
        $("#node_creator .nodetype_description").show();
        $("#node_creator > .source").show();
        $("#node_creator").dialog();
        self.currentNode = obj.parents(".node").attr("id");
        self.currentCollection = obj.parents(".node").data("collection");
        self.pickCollection = self.currentCollection;
        //self.currentNodePosition = obj.parents(".node").position();
    }
    
    // shows all but source nodes and set current node, collection and position
    this.openCreator = function(data, event) {
        //self.selectNode(data, event);
        var obj = $(event.target);
        $("#node_creator > div").show();
       
        $("#node_creator > .source").hide();
        $("#node_creator > .collection").hide();
        $("#node_creator").dialog();

        self.currentNode = obj.parents(".node").attr("id");
        self.currentCollection = obj.parents(".node").data("collection");
        self.pickCollection = self.currentCollection;
        //self.currentNodePosition = obj.parents(".node").position();
    }
        

    // show only collection node(s).
    this.openCollectionCreator = function(data, event) {
        var obj = $(event.target);
        $("#node_creator > div").hide();
        $("#node_creator > .collection").show();
        $("#node_creator").dialog();
    }
        
    this.selectNode = function (data, event) {
        var obj = $(event.target);
        var settings = obj.parent().find(".node_buttons");
        self.selectedNode = data;
        
        if(typeof data.params.collection !== "undefined")
            self.currentCollection = data.params.collection
        else
            self.currentCollection = data.collection
        
        self.pickCollection = self.currentCollection;
        
        // plain script tag causes confusion in html views so we restore it here
        data.views.settings = data.views.settings.replace(/_script/g,'script');	

        
        //settings.toggle();
        $(".pipe .block").removeClass("selected");
        obj.parents(".block").addClass("selected");

        self.openNodeView(data, event);
        self.setSettingsValues(data);
        
    }

    this.nodeParams = function (data) {
        var html = "<table>";
        for(var prop in data.params) {
            html += "<tr><td class='strong'>params."+prop+"</td><td>" + data.params[prop] + "</td></tr>";
        }
        html += "</table>";
        html += "<div>node id: " + data._id + "</div>";
        return html;
    }


    this.resetSettings = function () {
        node_settings_html = '<div id="node_bar" class="selected"><h2>Select node</h2></div>';
        $('#node_bar').replaceWith(node_settings_html);
    }

    this.setSettingsValues = function (data) {
        for(var prop in data.settings) {
            if(typeof data.settings[prop] == "boolean") {
                $("input[name='"+prop+"']").prop("checked", data.settings[prop]);
            } else {
                if(data.settings[prop].constructor.name === "Array") {
                    for(var i = 0; i < data.settings[prop].length; i++) {
                        var n = i+1;
                        $("input[name='"+prop+"["+n+"]']").val(data.settings[prop][i]);
                    }
                } else {
                    $("input[name='"+prop+"']").val(data.settings[prop]);
                }
            }
        }
    }

    this.displaySettings = function (data, event) {
        var obj = $(event.target);
        obj.parent().find(".settings_wrapper").toggle();
        obj.parent().find(".params_wrapper").toggle();
    }

    this.getSettings = function (data) {
        // plain script tag causes confusion in html views so we restore it here
        var r = data.views.settings.replace(/\[\[node\]\]/, "var node = {}; node.params = " + JSON.stringify(data.params) +"\n");	
        r = r.replace(/__node_id__/g, data._id); // write node id so that node's client script can refer to itself
        return r.replace(/_script/g,'script');	
    }

    this.closeCreator = function(data, event) {
        $("#node_creator").hide();
    }

    this.nodeInfo = function(data) {
        var html = '<div  class="node_info">';
		if(data.type == "collection")
            html += '<div class="node_title">'+data.params.description+'</div>'; 
		else if (data.params.title)
			html += '<div class="node_title">' + data.params.title + '</div> ';
            
		html += '</div>';
        return html;
    }


    this.openNodeTypes = function(data, event) {
        var obj = $(event.target);
        var current = obj.parent().find(".node_types");

        $(".nodetype_description").hide();
        obj.parent().find(".nodetype_description").show();
                
        // toggle
        if(current.is(":visible")) {
            current.hide();
        } else {

            // close all tabs
            obj.parent().parent().find(".node_types").hide();
            obj.parent().parent().find(".settings").hide();
            // open current tab
            current.show();
            $(".params").hide();
        }
    }


    this.openNodeParams = function(data, event) {
        var obj = $(event.target);
        var params = obj.parent().find(".params");

        
        if(params.is(":visible")) {
            $(".params").hide();
        } else {
            $(".params").hide();
            params.show();
        }
    }



    // opens/creates a view
    this.openNodeView = function(data, event) {

        // show settings
        $(".node_settings").hide();
        if(data.type != "collection") { // collection has no settings 
            var content = $("#tab-settings-"+data._id);
            content.show();
        }

        // show data view
        var url = '/node/view/' + data._id;
        // for transform node show only node's out_field
        //alert(data.iframe_src == null);
        if(data.iframe_src == null) {
            if(data.type == "transform" || data.type == "lookup" || data.type == "download" || data.type == "detect")
                url += "?fields=" + data.out_field;
        } else {
            url += data.iframe_src; 
        }
        $('#iframe_view').attr('src', url);

        
    }

    this.updateNodeViewURL = function (node_id, url) {
        //alert(node_id + " = " + self.selectedNode._id);
        if(self.selectedNode)
            self.selectedNode.iframe_src = url;
        //console.log("iframe src:" + url);
        
    }

    this.generateParams = function (data) {
        var div = $("<div class=\"params\"></div>");
        //params.append(div);
        
        if(data.type == "source") {
            if(data.subtype == "file") {
                var form = $("<form data-nodeid=\""+data.nodeid+"\" id=\"uploadfile\" action=\"\" method=\"post\" enctype=\"multipart/form-data\">");
                var submit = $("<input type=\"submit\" value=\"upload and create source node\" class=\"submit\" />");
                div.append(form);
                form.append(data.views.params);
                form.append(submit);
            } else {
                div.append(data.views.params);
                div.append("<button data-nodeid=\""+data.nodeid+"\" class=\"createnode\">Create node</button>");
            }
        } else {
            div.append(data.views.params);
            div.append("<button data-nodeid=\""+data.nodeid+"\" class=\"createnode\">Create node</button>");
        }
        return div.prop('outerHTML');
    }



    this.deleteNodeConfirm = function (data, event) {
        var obj = $(event.target);
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
    

    
    this.reloadProject = function () {
        self.projectCollections.removeAll();
        self.projectNodes.removeAll();
        self.loadProject();
    }

    this.getProjectNode = function (id) {
        var arr = self.projectNodes();
        for (var i = 0; i < arr.length; i++) {
            if(arr[i]._id == id)
                return arr[i];
        }
    }

}

$( document ).ready(function() {
    
    //$("#node_creator").hide();
    $("#node_creator").dialog({ 
        position: { 
            my: 'left top',
            at: 'right top',
            of: $('#project_header')
        },
        dialogClass:"node_creator",
        maxHeight:650,
        width:450
    });
    $("#node_creator").dialog("close");

	nodes = new nodeList();
	var path = window.location.pathname.split("/");
	nodes.currentProject = path[path.length - 1];
	ko.applyBindings(nodes);
	nodes.loadNodes(nodes);
	nodes.loadProject(nodes);



    // SORTABLE PROJECT NODES
    $( ".pipe" ).sortable({
      revert: true,
      handle: ".drag_icon" 
    });



    // handler for file upload node creation
    $(document).on('submit', "#uploadfile", function(e) {

        var params = {};
        var obj = $(e.target);
        $("#message").empty(); 
        $('.loading').show();
        
        // read params
        obj.find("input,textarea, select").not("input[type=button],input[type=submit]").each(function(){
            params[$(this).attr("name")] = $(this).val(); 
        });
        e.preventDefault();
        var obj = $(e.target);
        var nodeId = obj.data("nodeid");
        var fd = new FormData(this);
        fd.append("project",nodes.currentProject);
        
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
                    data.nodeid = nodeId;
                    data.project = nodes.currentProject;
                    data.input_node = nodes.currentNode; 
                    data.collection = nodes.currentCollection; 
                    $.post("/create/node", data, function(returnedData) {
                        console.log('created node');
                        $("#node_creator").hide();
                        nodes.reloadProject();
                    });
                }
            }	        
       });
    });


    // handler for normal node creation
    $(document).on('click', ".createnode", function(e) {
        var data = {};
        var params = {};
        var obj = $(e.target);
        
        // read params
        obj.parent().find("input,textarea, select").not("input[type=button]").each(function(){
            params[$(this).attr("name")] = $(this).val(); 
        });
        
        data.params = params;
        data.nodeid= obj.data("nodeid");
        data.project = nodes.currentProject;
        data.input_node = nodes.currentNode; 
        
        $("#message").empty();

        if(data.nodeid == "collection_basic") {
            $.post("/create/collection/node", data, function(returnedData) {
                console.log('created node');
                $("#node_creator").hide();
                nodes.reloadProject();
            });
        } else {
            data.collection = nodes.currentCollection;
            $.post("/create/node", data, function(returnedData) {
                console.log('created node');
                $("#node_creator").hide();
                nodes.reloadProject();
            });
        }
        
        $("#node_creator").dialog("close");
        e.preventDefault();
    });


    $(document).on('click','.run', function(e) {
        
        var obj = $(e.target);
        var map = {};
        // read input from settings
        obj.parent().parent().find(".settings input, .settings select").each(function() {
            var nameSplitted = $(this).attr("name").split("[");
            // if input name has form "set[something1]", then we want to gather all of them to array
            if(nameSplitted.length > 1) {
                //map[nameSplitted[0]] = $(this).val();
                (map[nameSplitted[0]] || (map[nameSplitted[0]] = [])).push($(this).val());
            } else {
                map[$(this).attr("name")] = $(this).val();
            }
        });
        // and run
        runNode(map, this.id);
        e.preventDefault();
    });	



    $(document).on('click','.dynamic_field', function(e) {
        
        var obj = $(e.target);
        nodes.currentInput = obj;   // put input to global variable so that we can update it later
        
        // fetch fields
        $.getJSON("/get/collection/" + nodes.pickCollection + "/fields", function(data) { 
            if(data.error)
                alert(data.error);


            var html = "<ul>";
                for (var i = 0; i < data.sorted.length; i++) {
                    var key = data.keys[data.sorted[i]];
                    html += "<li class='pick_field' data-field='"+ obj.attr("name") +"' data-val='" + data.sorted[i] + "'>" + data.sorted[i] + "<span class='array'>" + key.type + "</span></li>";

                }
            html += "</ul>"
                
            
            // open dialog
            $("#dynamic_fields").empty();
            $("#dynamic_fields").append(html);
            $("#dynamic_fields").dialog({
                position: { 
                    my: 'left top',
                    at: 'right top',
                    of: obj
                },
                title: "choose field"
            });
            
        })
    });


    $(document).on('click','.pick_field', function(e) {
        var obj = $(e.target);
        
        nodes.currentInput.val(obj.data("val"));
        nodes.currentInput.change();
        nodes.currentInput = null;
        
        $("#dynamic_fields").dialog("close");
    });


    $(document).on('click','.pick_collection', function(e) {
        var obj = $(e.target);
        
        nodes.currentInput.val(obj.data("val"));
        nodes.currentInput.change();
        nodes.currentInput = null;
        
        // we pick fields from different collection than where we are adding the node
        nodes.pickCollection = obj.data("val");
        
        $("#dynamic_fields").dialog("close");
    });



    $(document).on('click','.dynamic_collection', function(e) {
        
        var obj = $(e.target);
        nodes.currentInput = obj; 

        
        var html = "<ul>";
        for(var i = 0; i < nodes.projectNodes().length; i++) {
            var node = nodes.projectNodes()[i];
            if(node.type == "collection" && node.collection != nodes.currentCollection) {
                html += '<li class="pick_collection" data-field="source_collection" data-val="'+node.collection+'">' + node.collection + '</li>';
            }
        }
        html += "</ul>";
        //params.append("<div class='dynamic_fields'>"+html+"</div>");

        // open dialog
        $("#dynamic_fields").empty();
        $("#dynamic_fields").append(html);
        $("#dynamic_fields").dialog({
            position: { 
                my: 'left top',
                at: 'right top',
                of: obj
            },
            title: "choose collection"
        });

    })


    


    // websocket stuff
    var socket = io.connect('http://localhost');

    socket.on('hello', function (data) {
        var cons = $("#tab-settings-" + data.nodeid +" .node_cons");
        if(data.nodeid) {
            cons.append("<div class=\"error\">" + data.msg + "</div>");
        } else {
            cons.append(data + "</br>");
            tailScroll(cons) ;
        }
    });

    
    socket.on('news', function (data) {
        var cons = $("#tab-settings-" + data.nodeid +" .node_cons");
        if(data.nodeid) {
            cons.append("<div class=\"error\">" + data.msg + "</div>");
        } else {
            cons.append(data + "</br>");
            tailScroll(cons) 
        }
    });

    socket.on('progress', function (data) {
        var cons = $("#tab-settings-" + data.nodeid +" .node_cons");
        cons.append("<div class=\"progress\">" + data.msg + "</div>");
        tailScroll(cons);
    });

    socket.on('error', function (data) {
        var cons = $("#tab-settings-" + data.nodeid +" .node_cons");
        if(data.nodeid) {
            cons.append("<div class=\"bad\">" + data.msg + "</div>");
            cons.removeClass("busy");
            cons.addClass("done");
        } else {
            $("#cons").append("<div class=\"bad\">" + data + "</div>");
            tailScroll(cons);
        }
    });

    socket.on('finish', function (data) {
        var cons = $("#tab-settings-" + data.nodeid +" .node_cons");
        cons.empty();
        cons.append("<div class=\"good\">" + data.msg + "</div>");
        cons.removeClass("busy");
        cons.addClass("done");
        // refresh data view
        reloadIframe ();
    });


    
});




