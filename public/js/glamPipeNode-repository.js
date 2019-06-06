
var nodeRepository = function (gp) {
	var self = this;
	this.nodes = [];
	this.gp = gp;
	this.showBrokenNodes = false;
	this.plainNodes = []
	this.baseAPI = g_apipath;
	this.visible_tags = ["wmf"];

	this.loadNodes = async function () {
		var data = await $.getJSON(self.baseAPI + "/repository/nodes", function(data) {
			for(var i = 0; i< data.length; i++) {
				self.nodes.push(data[i]);
			}
		})
	}

	this.verbose = {
		"source": {
			"collection": "Read data from collection",
			"web": "Read data from web",
			"file": "Read data from files"
		},
		"process": {
			"strings": "Modify data",
			"documents": "Modify whole records",
			"format": "Map data",
			"files": "File operations",
			"lookups": "Look up data",
			"meta": "Series of operations",
		},
		"export": {
			"file": "Export data to file",
			"web": "Export data to web"
		},
		"view": {
			"data": "View data"
		}
	}

	this.renderNodeList = async function (div, type) {

		// if node list is already open, then we "collapse" it
		if(div.find(".listoption").length) {
			div.empty();
			return;
		}

	
		var nodes = await $.getJSON(self.baseAPI + "/collections/gp_nodes/docs/?keys=core,type,subtype,title,description,status&limit=100&sort=type,subtype,title&reverse=0&type=" + type);
		console.log(nodes);

		var html = "";
		html += "<div class='fatbox'>";
		html += "  <div class='inlinetitleblock'>";
		html += "    <div><span class='title inlinetitle'>Choose type</span></div>"
		html += "  </div>"
		
		var types = [];
		for(var node of nodes.data) {
			if(node.type == type) {
				if(!types.includes(node.subtype)) {
					html += "  <div class='optionlist'>"
					html += "    <button class='accordion " + node.subtype + "'>";
					// add some verbosity
					if(self.verbose[node.type] && self.verbose[node.type][node.subtype])
						html += "      <p class='listtitle'>" + self.verbose[node.type][node.subtype] + "</p>";
					else
						html += "      <p class='listtitle'>"+node.subtype+"</p>"
					html += "</button>"
					html += "    <div class='panel'>"
					html += renderNodes(nodes, node.subtype);
					html += "</div>"
					types.push(node.subtype);
				} else {
					
				}
			}
		}
		html += "</div>"
		html += "</div>"
		html += "</div>"
		$(div).empty().append(html);
		return;

	}

	function renderNodes(nodes, subtype) {
		var html = "";
		for(var node of nodes.data) {
			if(node.subtype == subtype && node.core) {
				html += "<a  class='open-node' href='"+node._id+"'>"
				html += "<div class='listoption " + node.type + " " + node.status + "'>"
				var split = node.title.split(":");
				if(split.length > 1)
				html += "  <p class='listtitle'><span class='bold'>" + split[0] + "</span>" + split[1] +"</p>"
				else
				html += "  <p class='listtitle'>" + node.title + "</p>"
				html += "  <p class='listtext'>" + node.description + "</p>"
				html += "</div>"
				html += "</a>"		
			}
		}
		return html;
	}

	this.getNodeByIndex = function (index) {
		 return self.plainNodes[parseInt(index)];
	}

	this.getNodeContent = async function (click, div) {
		var node = await $.getJSON(self.baseAPI + "/collections/gp_nodes/docs/" + click.attr("href"));
		return node;
	}

	this.openNodeParameters = async function (click, collection) {
		var collection = self.gp.currentCollectionNode.source.collection;
		var node = await $.getJSON(self.baseAPI + "/collections/gp_nodes/docs/" + click.attr("href"));
		console.log(node)

		var html = "";
		html += "<div class='fatbox " + node.type + " " + node.status + "'>"
		html += "  <fatboxtitle>" + node.title + "</fatboxtitle>";
		html += "  <fatboxdescription>" + node.description + "</fatboxdescription>"

		// we need to create form for file import (upload)
		if(node.type == "source") {
			if(node.subtype == "file") {
				html += "<form id=\"uploadfile\" action=\"\" method=\"post\" enctype=\"multipart/form-data\">";
				html += node.views.params;
				html += "</form>";
			} else {
				html += node.views.params;
			}
		} else {
			html += node.views.params;
		}
		html += "  <fatboxsubmitblock>";
		html += "    <a href='#'>"
		html += "      <div data-id='"+node._id+"' class='button create-node'>Create node</div>"
		html += "    </a>";
		html += "  <fatboxsubmitblock>";
		html += "</div>"

		var params = $(html);
		if( $(click.parents(".holder.params")).length != 0)
			$(click.parents(".holder.params").empty()).append(params);
		else
			$(".holder.collection-params").empty().append(params);


		// fetch fields
		var result = await $.getJSON(self.baseAPI + "/collections/" + collection + "/fields");
		if(result && result.keys) {
			var options = [];
			for(var i = 0; i < result.keys.length; i++) {
				options.push("<option>" + result.keys[i] + "</option>");
			}

			// populate field selects
			$(".params select.dynamic-field").each(function(i) {
				$(this).append(options.join(""));
			//    $(this).replaceWith("<select id='" + $(this).attr("id") + "' name='" + $(this).attr("name") + "' class='dynamic_field'><option value=''>choose field</option>"+options.join("")+"</select>");
			})
		}
		// TODO: get node from /get/node/nodeid so that scripts are included
		// execute params.js if exists
		//if(node.scripts.params) {
			//var paramsScript = new Function('node', node.scripts.params);
			//paramsScript(node);
		//}
		//$('.dynamic_collection').append(self.gp.collectionList());
	}


}


function cap(string) {
	return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

function sortByTitle (a,b) {
  if (a.title.toLowerCase() < b.title.toLowerCase())
	return -1;
  if (a.title.toLowerCase() > b.title.toLowerCase())
	return 1;
  return 0;
}

function sortByVerbose (a,b) {
  if (a.text.toLowerCase() < b.text.toLowerCase())
	return -1;
  if (a.text.toLowerCase() > b.text.toLowerCase())
	return 1;
  return 0;
}

function sortNodeTypes (a,b) {
	console.log(b._id.type)
  if (a._id.type < b._id.type)
	return -1;
  if (a._id.type > b._id.type)
	return 1;
  return 0;
}
