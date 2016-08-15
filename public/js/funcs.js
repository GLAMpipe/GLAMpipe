
function runNode(settings, node_id) {
    //var cons = $(".node_console");
    //cons.empty();
    //$(".node_console").empty();
    //cons.append("running...");
    //cons.removeClass("done");
    //cons.addClass("busy");
    
    // save settings also locally
    nodes.selectedNode.settings = settings;
    
    $.post("/run/node/" + node_id, settings, function(data) {
        console.log('node executed');
        if(data.error)
            alert(data.error);
    });
}





function reloadIframe () {
    $("#iframe_view" ).attr( "src", function ( i, val ) { return val; });
}

function addTab(tabs, tabId, title, url, content, tabClass) {
    
    var tabTemplate = "<li class='"+tabClass+"'><a class='tabref' href='#{href}' rel='#{url}'>#{label}</a> <span class='ui-icon ui-icon-close' role='presentation'>Remove Tab</span></li>";
    var label = title;
    var milliseconds = (new Date).getTime();
    
    if(!tabId)
        tabId = "tabs-" + milliseconds;
    
    var liCont = tabTemplate.replace( /#\{href\}/g, "#" + tabId );
    liCont = liCont.replace( /#\{label\}/g, label );
    liCont = liCont.replace( /#\{url\}/g, url );
    var li = $(liCont);

    if(url) {
        var tabContent = $("<div class='tab' id='" + tabId + "'></div>");
        tabContent.append(content);
        tabs.append(tabContent);
    }

    tabs.find( ".ui-tabs-nav" ).append( li );
    tabs.tabs( "refresh" );
    
    // activate last tab
    var tabCount = $('#tabs >ul >li').size();
    $( "#tabs" ).tabs({ active: tabCount-1 });
}


function makeDynFieldsfromObject (data, parents, obj) {
    
    var html = "";
    var parents_str = parents.join(".");
    for (key in data) {
        if (data[key] instanceof Array) {
            html += "<li class='pick_field' data-field='"+ obj.attr("name") +"' data-val='"+parents_str +"."+key+"'>"+key+" <span class='array'>ARRAY</span></li>";
        } else if (typeof data[key] === "object") {
            var p = key;
            parents.push(p);
            var tree = makeDynFieldsfromObject(data[key], parents, obj);
            parents.pop();
            html +=  "<li>" + p + "<ul>" + tree + "</ul></li>";
        } else {
            html += "<li class='pick_field' title='"+data[key]+"' data-field='"+ obj.attr("name") +"' data-val='"+parents_str +"."+key+"'>"+key+"</li>";
        }
    }
    return html;
}

// console effect from here: http://jsfiddle.net/manuel/zejCD/1/
function tailScroll(cons) {
    var height = cons.get(0).scrollHeight;
    cons.animate({
        scrollTop: height
    }, 50);
}
