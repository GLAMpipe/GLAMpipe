var mongojs = require('mongojs');
const vm 		= require('vm');
var path        = require('path');
var mongoquery 	= require("../app/mongo-query.js");


var exports = module.exports = {};


exports.createNodeView = function (data, req, edit, callback) {
	var nodeId = req.params.id;
	console.log("nodeid", nodeId);
	mongoquery.findOne({"nodes._id":mongojs.ObjectId(nodeId)}, "mp_projects", function(project) {
		if(project) {
			var index = indexByKeyValue(project.nodes, "_id", nodeId);
			var node = project.nodes[index];
            node.project_dir = project.dir;
            var editLink = "/node/editview/" + node._id;
			data = data.replace(/\[\[collection\]\]/, node.collection);
			data = data.replace(/\[\[page_title\]\]/, node.title);
			data = data.replace(/\[\[edit_link\]\]/, editLink);
			data = data.replace(/\[\[tab_link\]\]/, "/node/view/" + node._id);
            // insert node json to view so that client scripts can use node data (also hide script tags)
			data = data.replace(/\[\[node\]\]/, "var node = " + JSON.stringify(node).replace(/script>/g,"_script>"));
			
			// if node has script view, then use that
			if(typeof project.nodes[index].scripts.view !== "undefined") {
                
				sandbox = {out:{}, context: {node:node}};
				vm.runInNewContext(node.scripts.view, sandbox);
                if(sandbox.out.htmlfile) {
                    var fs = require('fs');
                    var file = path.join(global.config.dataPath, "nodes", "data", sandbox.out.htmlfile);
                    var contents = fs.readFileSync(file).toString();
                    contents = contents.replace(/\[\[node\]\]/, "var node = " + JSON.stringify(node).replace(/script>/g,"_script>"));
                    callback(contents);
                } else { 
                    callback(sandbox.out.html);
                }
			
			// if node has static view, then we use that
			} else if(typeof project.nodes[index].views.data !== "undefined") {
				// insert node's data view to view.html
				data = data.replace(/\[\[html\]\]/, project.nodes[index].views.data);
				callback(data);
			
			// otherwise we create view on the fly (dynamic view)
			} else {

				if(req.query.fields != null) var fields = req.query.fields;
				else var fields = null;
				
				generateDynamicView(project.nodes[index], fields, edit, function(keys, html) {
					data = data.replace(/\[\[keys\]\]/, keys);
					data = data.replace(/\[\[html\]\]/, html);
					callback(data);
				});
			}
		} else {
			callback("<h1>Node view not found</h1><p>Maybe you deleted the node?</p>");
		}
	});
}



exports.createCollectionView = function (data, collectionName, callback) {
	mongoquery.findOne({"nodes.collection":collectionName}, "mp_projects", function(project) {
		var index = indexByKeyValue(project.nodes, "collection", collectionName);
		data = data.replace(/\[\[project\]\]/, project.title);

		// insert node's html view to view.html
		if(typeof project.nodes[index].views.data === "undefined") {
			generateDynamicView(project.nodes[index], function(msg) {
				data = data.replace(/\[\[html\]\]/, project.nodes[index].views.data);
				callback(data);
			});
		} else {
			data = data.replace(/\[\[html\]\]/, project.nodes[index].views.data);
			callback(data);
		}
		
		
	});
}




function generateDynamicView (node, fields, edit, callback) {
	// read one record and extract field names
    // create knockout template from that data
	// NOTE: this assumes that every record has all fields
	mongoquery.findOne({}, node.collection, function(data) {
		

		if(data) {

			if(data.__mp_source)
				delete data.__mp_source;




            var keys = '';
            var html = '';
			html += ''

				+ '<div>'
				+ '	<table>'
				+ '		<thead>'
				+ '			<tr>';

			html += '			<th id="vcc" data-bind="click: sort">[count]</th>'

			for (key in data) {
                    keys += '<option value="'+key+'">'+key+'</option>'
			}

			// remove keys that are not listed in "fields" TODO: maybe this should be done in query
			if(fields != null) {
				var fields_arr = fields.split(",");
				for (key in data) {
					if(fields_arr.indexOf(key) == -1)
						delete data[key];
				}
			}


			for (key in data) {
					html += '			<th id="'+key+'" data-bind="click: sort">'+key+'</th>'
			}

			html += '			</tr>'
				+ '		</thead>'
				+ '		<tbody data-bind="foreach: collection">'
				+ '			<tr>';

			// data cells
			html += '				<td data-bind="text: vcc"></td>'
			for (key in data) {
                
                // EDIT VIEW
                if (edit) {
                    if(key == "_id") // id is not editable 
                        html += '				<td data-bind="text: '+key+'"></td>';
                    else if (typeof data[key] !== "object" && data[key].constructor.name !== 'Array') 
                        html += '                               <td><div class="data-container" data-field="'+key+'" data-bind="inline: '+key+',attr:{\'data-id\':$data._id}"></div></td>';
                    else 
                        html += '				<td><div class="data-container warning">Currently can not edit arrays or objects</div></td>';

                //  DATA VIEW
                } else if (data[key] != null && data[key].constructor.name === 'Array') {
                        html += '           <td class="array">' 
						//html += '				<div class="data-container" data-bind="foreach: $root.keyValueList($data[\''+key+'\'])">'
						html += '				<div class="data-container" data-bind="foreach: '+key+'">'
                        html += '                   <div data-bind="html:$root.keyValue($data)"></div>'
                        html += '               </div>'
						html += '           </td>'

                } else if (typeof data[key] === "object") 
                    html += '                   <td><div class="data-container" data-bind="html:$root.keyValueObj($data,\''+key+'\')"></div></td>';
                else
                    html += '				<td><div class="data-container" data-field="'+key+'" data-bind="inline: '+key+',attr:{\'data-id\':$data._id}"></div></td>';
					
			}

			html += '			</tr>'
				+ '		</tbody>'
				+ '	</table>'
				+ '</div>';

			callback(keys, html);
		} else {
			callback("<h3>dynamice view creation failed!</h3> Maybe collection is empty?</br>" + node.collection);
		}
	});
}





function indexByKeyValue(arraytosearch, key, value) {

	for (var i = 0; i < arraytosearch.length; i++) {
		if (arraytosearch[i][key] == value) {
			return i;
		}
	}
	return null;
}
