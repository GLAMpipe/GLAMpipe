


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
        self.selectNode(data, event);
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
        self.selectNode(data, event);
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
        self.selectedNode = data;
        
        if(typeof data.params.collection !== "undefined")
            self.currentCollection = data.params.collection
        else
            self.currentCollection = data.collection
        
        $("#test_results").hide();
        
        // plain script tag causes confusion in html views so we restore it here
        data.views.settings = data.views.settings.replace(/_script/g,'script');	
        
        var node_settings_html = 
            '<div id="node_bar" class="selected">' + 
            '	<h2>' +data.type+": " +data.title+ '</h2>' +
            '	<div class="number">node number: '+data.number+'</div>' +
            '	<h3 class="subhead">params</h3>' +
            '	<div class="node_params">' +
                    self.nodeParams(data) +
            '	</div>' +
            '	<h3 class="subhead">settings</h3>' +
            '	<div class="settings">' +
                    data.views.settings +
            '	</div>';

        if(data.type == 'transform' || data.type == 'lookup') {
            node_settings_html += '	<button id="'+data._id+'" class="test">test!</button>';
        } 

        if(data.type != 'collection') {
            node_settings_html += '	<button id="'+data._id+'" class="run">run this node!</button>';
        } 

        node_settings_html += '</div>';
        
        $('#node_bar').replaceWith(node_settings_html);
        $("#mainCanvas .block").removeClass("selected");
        obj.parents(".block").addClass("selected");
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
            if(typeof data.settings[prop] == "boolean")
                $("input[name='"+prop+"']").prop("checked", data.settings[prop]);
            else
                $("input[name='"+prop+"']").val(data.settings[prop]);
        }
    }

    this.closeCreator = function(data, event) {
        $("#node_creator").hide();
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
        $(".collection_pipe").empty();
        self.loadProject();
    }


    this.openTab = function (data, event) {
        var url = '/node/view/' + data._id;
        addTab(self.tabs, data.title, url);
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

    var $tabs = $('#tabs').tabs();
    nodes.tabs = $tabs;
    var beginTab = $("#tabs ul li:eq(" + getSelectedTabIndex($tabs) + ")").find("a");
    loadTabFrame($(beginTab).attr("href"),$(beginTab).attr("rel"));

    // close icon: removing the tab on click
    $("#tabs").on("click",  "span.ui-icon-close", function() {
      var panelId = $( this ).closest( "li" ).remove().attr( "aria-controls" );
      $( "#" + panelId ).remove();
      $tabs.tabs( "refresh" );
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
                    // send also x and y so that new node can be positioned close
                    data.position = nodes.currentNodePosition;
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
         
        // send also x and y so that new node can be positioned close
        data.position = nodes.currentNodePosition;
        
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


    // websocket stuff
    var socket = io.connect('http://localhost');

    socket.on('hello', function (data) {
        $("#console").append(data + "</br>");
        tailScroll() 
      });

    
    socket.on('news', function (data) {
        //console.log(data);
        $("#console").append(data + "</br>");
        tailScroll() 
      });

    socket.on('progress', function (data) {
        //console.log(data);
        $("#console").append("<div class=\"progress\">" + data + "</div>");
        tailScroll() 
      });

    socket.on('error', function (data) {
        console.log(data);
        $("#console").append("<div class=\"bad\">" + data + "</div>");
        $("#node_msg").removeClass("busy");
        $("#node_msg").addClass("done");
        $("#node_msg").html("<div class=\"bad\">ERROR: " + data + "</div>");
        tailScroll() 
      });

    socket.on('finish', function (data) {
        $("#console").append("<div class=\"good\">" + data + "</div>");
        tailScroll(); 
        $("#node_msg").removeClass("busy");
        $("#node_msg").addClass("done");
        $("#node_msg").html("");
      });

    $("a.tabref").click(function() {
        loadTabFrame($(this).attr("href"),$(this).attr("rel"));
    });
    
});







// iframes setup from http://deano.me/2011/08/jquery-tabs-iframes/

function loadTabFrame(tab, url) {
    if ($(tab).find("iframe").length == 0) {
        var html = [];
        html.push('<div class="tabIframeWrapper">');
        html.push('<iframe class="iframetab" src="' + url + '">Load Failed?</iframe>');
        html.push('</div>');
        $(tab).append(html.join(""));
    }
    return false;
}

function getSelectedTabIndex($tabs) {
    return $tabs.tabs('option', 'active');
}


function addTab(tabs, title, url) {
    var tabTitle = $( "#tab_title" ),
      tabContent = $( "#tab_content" ),
      tabTemplate = "<li><a class='tabref' href='#{href}' rel='#{url}'>#{label}</a> <span class='ui-icon ui-icon-close' role='presentation'>Remove Tab</span></li>",
      tabCounter = $('#tabs >ul >li').size();
      console.log("size", tabCounter);
      
    tabCounter++;
    var label = title;
    var id = "tabs-" + tabCounter;
    var liCont = tabTemplate.replace( /#\{href\}/g, "#" + id );
    liCont = liCont.replace( /#\{label\}/g, label );
    liCont = liCont.replace( /#\{url\}/g, url );
    var li = $(liCont);
    var tabContentHtml = tabContent.val() || "Tab " + tabCounter + " content.";

    tabs.find( ".ui-tabs-nav" ).append( li );
    tabs.append( "<div class='tab' id='" + id + "'></div>" );
    tabs.tabs( "refresh" );
    
    loadTabFrame("#" + id, url);
    var tabCount = $('#tabs >ul >li').size();
    $( "#tabs" ).tabs({ active: tabCount-1 });
}



	// console effect from here: http://jsfiddle.net/manuel/zejCD/1/
	function tailScroll() {
		var height = $("#console").get(0).scrollHeight -260;
		$("#console").animate({
			scrollTop: height
		}, 50);
	}
