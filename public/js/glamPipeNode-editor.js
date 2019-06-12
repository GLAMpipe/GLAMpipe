
var nodeEditor = function (gp) {

	var self = this;
	this.baseAPI = g_apipath;

	this.editor = ace.edit('editor');
	this.editor.setTheme('ace/theme/twilight');
	this.editor.session.setMode('ace/mode/javascript');
	this.editor.setOption("useWrapMode", true);

	this.loadNode = async function (div, type) {

		var path = window.location.pathname.split("/");
		self.node_id = path[path.length - 1];

		$.getJSON(self.baseAPI + "/repository/nodes/" + self.node_id, function(node) {
			if(node.nodeid)
				self.currentNode = node;
			else {
				self.editor.setValue("***************** \n COULD NOT FIND NODE!!");
				alert("Node not found!")
			}
			
		})

	}
	
	this.openScript = async function(id) {
		console.log(id)
		id = id.split(".");
		if(id[1] === "html") {
			this.editor.session.setMode('ace/mode/html');
			self.editor.setValue(self.currentNode.views[id[0]]);
		} else {
			this.editor.session.setMode('ace/mode/javascript');
			self.editor.setValue(self.currentNode.scripts[id[0]]);
		}
	}
}

