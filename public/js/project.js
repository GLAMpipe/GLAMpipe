


var nodeList = function () {
	var self = this;

	this.collection = ko.observableArray(); 
	this.projectNodes = ko.observableArray(); 
	this.documents = ko.observableArray(); 

    // get project nodes
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
        $("#node_creator").show();
        $("#node_creator > div").hide();
        $("#node_creator > .source").show();
        self.currentNode = obj.parents(".node").attr("id");
        self.currentCollection = obj.parents(".node").data("collection");
        self.currentNodePosition = obj.parents(".node").position();
    }
    
    // shows all but source nodes and set current node, collection and position
    this.openCreator = function(data, event) {
        //self.selectNode(data, event);
        var obj = $(event.target);
        $("#node_creator > div").show();
        $("#node_creator > .source").hide();
        $("#node_creator > .collection").hide();
        $("#node_creator").show();
        self.currentNode = obj.parents(".node").attr("id");
        self.currentCollection = obj.parents(".node").data("collection");
        self.currentNodePosition = obj.parents(".node").position();
    }
        

    // show only collection node(s).
    this.openCollectionCreator = function(data, event) {
        var obj = $(event.target);
        $("#node_creator").show();
        $("#node_creator > div").hide();
        $("#node_creator > .collection").show();
    }
        
    this.selectNode = function (data, event) {
        var obj = $(event.target);
        var settings = obj.parent().find(".node_buttons");
        self.selectedNode = data;
        
        if(typeof data.params.collection !== "undefined")
            self.currentCollection = data.params.collection
        else
            self.currentCollection = data.collection
        
        $("#test_results").hide();
        
        // plain script tag causes confusion in html views so we restore it here
        data.views.settings = data.views.settings.replace(/_script/g,'script');	

        
        //settings.toggle();
        $(".pipe .block").removeClass("selected");
        obj.parents(".block").addClass("selected");

        self.openNodeSettings(data, event);
        self.setSettingsValues(data);
        
    }

    this.nodeParams = function (data) {
        var html = "<table>";
        for(var prop in data.params) {
            html += "<tr><td class='strong'>params."+prop+"</td></tr><tr><td>" + data.params[prop] + "</td></tr>";
        }
        html += "</table>";
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

    this.getSettings = function (data) {
        // plain script tag causes confusion in html views so we restore it here
        var r = data.views.settings.replace(/\[\[node\]\]/, "var node = {}; node.params = " + JSON.stringify(data.params) +"\n");	
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


    // opens/creates a tab for settings
    this.openNodeSettings = function(data, event) {
        var obj = $(event.target);
        var settings = obj.parent().find(".node_settings");
        
        
        // if tab exists, then activate it
        var tab_id = "#tab-settings-" + data._id;
        if ($('#tabs a[href="'+tab_id+'"]').length) {
            var index = $('#tabs a[href="'+tab_id+'"]').parent().index();
            $("#tabs").tabs("option", "active", index);
        // otherwise create it
        } else {
            //var content = settings.clone(true);
            var content = $("#tab-settings-"+data._id);
            content.removeClass("hidden");
            
            var title = "<span class='strong'>SETTINGS:</span> " + data.title;
            id = "tab-settings-" + data._id;
            addTab(self.tabs, id, title, null, data.type); // null URL creates regular tab (not iframe)
        }
    }


    // opens/creates a tab for settings
    this.openNodeView = function(data, event) {
        var obj = $(event.target);
        var settings = obj.parent().find(".node_settings");

        var tab_id = "tab-view-" + data._id;
        if ($("#"+tab_id).length) {
            var index = $('#tabs a[href="#'+tab_id+'"]').parent().index();
            $("#tabs").tabs("option", "active", index);
            
            // reload view
            $("#" + tab_id + " div.tabIframeWrapper iframe.iframetab" ).attr( "src", function ( i, val ) { return val; });


            
        // otherwise create it
        } else {

            var url = '/node/view/' + data._id;
            // for transform node show only node's out_field
            if(data.type == "transform")
                url += "?fields=" + data.out_field;
            
            var title = "<span class='strong'>VIEW:</span> " + data.title;
            //var milliseconds = (new Date).getTime();
            
            addTab(self.tabs, tab_id, title, url, data.type);
            loadTabFrame("#" + tab_id, url);
        }
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
        obj.parent().find(".delete_confirm").show();
    }
    
    this.cancelDeleteNode = function (data, event) {
        var obj = $(event.target);
        obj.parent().parent().find(".delete_confirm").hide();
    }
    
    this.reallyDeleteNode = function (data, event) {
        
        var params = {node:data._id, project:self.currentProject};
        $.post("/delete/node/", params, function(data) {
            console.log('node deleted');
            if(data.error)
                alert(data.error);
            self.resetSettings();
            self.currentNode = null;
            self.currentCollection = null;
            self.currentNodePosition = null;
            self.reloadProject();
        });
    }
    
    this.reloadProject = function () {
        self.projectNodes.removeAll();
        self.loadProject();
    }


}

$( document ).ready(function() {
    
    $("#node_creator").hide();

	nodes = new nodeList();
	var path = window.location.pathname.split("/");
	nodes.currentProject = path[path.length - 1];
	ko.applyBindings(nodes);
	nodes.loadNodes(nodes);
	nodes.loadProject(nodes);

    // TABS CREATE
    var $tabs = $('#tabs').tabs( { 
        beforeActivate: function (event, ui) {
            reloadIframe(ui.newPanel.attr('id'));
        }
    });
    nodes.tabs = $tabs;
    var beginTab = $("#tabs ul li:eq(" + getSelectedTabIndex($tabs) + ")").find("a");
    loadTabFrame($(beginTab).attr("href"),$(beginTab).attr("rel"));

    // TABS LOAD
    $("a.tabref").click(function() {
        loadTabFrame($(this).attr("href"),$(this).attr("rel"));
    });

    // TABS CLOSE
    $("#tabs").on("click",  "span.ui-icon-close", function() {
        var panelId = $( this ).closest( "li" ).remove().attr( "aria-controls" );
        if(panelId.indexOf("tab-view") > -1) // views are removed, settings not
            $( "#" + panelId ).remove();
        $tabs.tabs( "refresh" );
    });


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
        var params = obj.parents(".params");
        if(params.length == 0)
            params = obj.parents(".settings");
        
        // fetch fields
        $.getJSON("/get/collection/fields/" + nodes.currentCollection, function(data) { 
            if(data.error)
                alert(data.error);
                
            var html = "<h2>document structure (keys)</h2><ul><li class='pick_field good' data-field='"+ obj.attr("name") +"' data-val=''>CLEAR FIELD and CLOSE</li>";
                for (key in data) {
                    if (data[key] instanceof Array) {
                        html += "<li class='pick_field' data-field='"+ obj.attr("name") +"' data-val='"+key+"'>"+key+"<span class='array'>ARRAY</span></li>";
                    } else if (typeof data[key] === "object" ) {
                        var p = key;
                        var a = [p];
                        if (data[key] === null) {
                            html +=  "<li class='pick_field' data-field='"+ obj.attr("name") +"' data-val='"+key+"'>"+key+"<span class='null'>null</span></li>";
                        } else {
                            var tree = makeDynFieldsfromObject(data[key], a, obj);
                            html +=  "<li>"+ p + "<ul>" + tree + "</ul></li>";
                        }
                    } else {
                        html += "<li class='pick_field' title='"+data[key]+"' data-field='"+ obj.attr("name") +"' data-val='"+key+"'>"+key+"</li>";
                    }
                }
            html += "</ul>"
            params.append("<div class='dynamic_fields'>"+html+"</div>");
            //alert(obj.position().top);
        })
    });



    $(document).on('click','.dynamic_collection', function(e) {
        var obj = $(e.target);
        var params = obj.parents(".params");
        if(params.length == 0)
            params = obj.parents(".settings");
        
        var html = "<ul>";
        for(var i = 0; i < nodes.projectNodes().length; i++) {
            var node = nodes.projectNodes()[i];
            if(node.type == "collection" && node.collection != nodes.currentCollection) {
                html += '<li class="pick_field" data-field="source_collection" data-val="'+node.collection+'">' + node.collection + '</li>';
            }
        }
        html += "</ul>";
        params.append("<div class='dynamic_fields'>"+html+"</div>");
    })


    
    $(document).on('click','.pick_field', function(e) {
        var obj = $(e.target);
        var params = obj.parents(".params");
        if (params.length == 0)
            params = obj.parents(".settings");
        
        params.find("input[name='"+obj.data("field")+"']").val(obj.data("val"));
        params.find(".dynamic_fields").remove();
    });


    // websocket stuff
    var socket = io.connect('http://localhost');

    socket.on('hello', function (data) {
        if(data.nodeid) {
            $("#tab-settings-" + data.nodeid +" .node_console").append("<div class=\"error\">" + data.msg + "</div>");
        } else {
            $("#console").append(data + "</br>");
            tailScroll() ;
        }
    });

    
    socket.on('news', function (data) {
        if(data.nodeid) {
            $("#tab-settings-" + data.nodeid +" .node_console").append("<div class=\"error\">" + data.msg + "</div>");
        } else {
            $("#console").append(data + "</br>");
            tailScroll() 
        }
    });

    socket.on('progress', function (data) {
        $("#tab-settings-" + data.nodeid +" .node_console").append("<div class=\"progress\">" + data.msg + "</div>");
    });

    socket.on('error', function (data) {
        var console = $("#tab-settings-" + data.nodeid +" .node_console");
        if(data.nodeid) {
            console.append("<div class=\"error\">" + data.msg + "</div>");
            console.removeClass("busy");
            console.addClass("done");
        } else {
            $("#console").append("<div class=\"bad\">" + data + "</div>");

            tailScroll()
        }
    });

    socket.on('finish', function (data) {
        var console = $("#tab-settings-" + data.nodeid +" .node_console");
        console.append("<div class=\"progress\">" + data.msg + "</div>");
        console.removeClass("busy");
        console.addClass("done");
    });


    
});




