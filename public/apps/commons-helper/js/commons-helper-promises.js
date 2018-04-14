

function Helper() {
	var self = this;
	self.gp = new GLAMpipe();
	self.fileField = "path";
	
	self.filename = null;

	self.getWSPath = function() {
		var paths = window.location.pathname.split("/");
		if(paths.length === 3)
			return "";
			
		if(paths[paths.length-2] === "project") {

			return "/" + paths.slice(1, paths.length-2).join("/");
		} else {
			return "";
		}
	}

	// websocket stuff
	self.gp_path = self.getWSPath();
	self.socket = io.connect(window.location.origin, {path: self.gp_path + '/socket.io'});
	self.progressDisplay = $("#node-progress");
	self.finishDisplay = $("#node-finished");
	self.genericDisplay = $("#generic-messages");


	self.createCSVProject = function(title) {
		return self.gp.createProject(title)
			.then(function(data) {
				self.project = self.gp.project;
				return self.gp.createCollection("upload");
			})
			.then(function(data) {
				config.nodes.csv.params.filename = filename;
				config.nodes.csv.params.file = "filu";
				return self.gp.createNode(config.nodes.csv);
			})
			.then(function(data) {
				config.nodes.csv.id = data.id;
				return self.gp.runNode(config.nodes.csv);
			})
	}

	self.createWikitext = function(template) {
		config.nodes.map.params.template = template;
		return self.gp.createNode(config.nodes.map)
			.then(function(data) {
				config.nodes.map.id = data.id;
				return self.gp.runNode(config.nodes.map);
			})
	}

	self.createPipeLine = function() {
		return self.gp.createNode(config.nodes.download)
			.then(function(data) {
				config.nodes.download.id = data.id;
				return self.gp.createNode(config.nodes.checksum)
			})
			.then(function(data) {
				config.nodes.checksum.id = data.id;
				return self.gp.createNode(config.nodes.check_if_commons)
			})
			.then(function(data) {
				config.nodes.check_if_commons.id = data.id;
				return self.gp.createNode(config.nodes.commons_upload)
			})
			.then(function(data) {
				config.nodes.commons_upload.id = data.id;
				return self.gp.saveNodeDescription(config.nodes.download)
			})
			.then(function(data) {
				return self.gp.saveNodeDescription(config.nodes.checksum);
			})
			.then(function(data) {
				return self.gp.saveNodeDescription(config.nodes.check_if_commons);
			})
			.then(function(data) {
				return self.gp.saveNodeDescription(config.nodes.commons_upload);
			})
			.catch(function(status) {
				alert("Did not work! Computer says: " + status );
				//throw("error!");
			});
	}

	self.checkIfCommons = function(button) {
		var doc = button.data("id");
		return self.gp.runNodeSingle(config.nodes.download, doc)
			.then(function(data) {
				return self.gp.runNodeSingle(config.nodes.checksum, doc)
			})
			.then(function(data) {
				return self.gp.runNodeSingle(config.nodes.check_if_commons, doc)
			})
			.then(function(data) {
				if(data.result.value == "") {
					button.replaceWith("No, good to go!");
				} else {
					button.replaceWith(data.result.value);
				}
			})
	}

	self.fieldsOk = function() {
		var url =  "/api/v1/collections/" + self.gp.collection + "/fields";
		$.getJSON(url, function(keys) {
			console.log(keys.sorted)
			if(!keys.sorted.includes("path") || !keys.sorted.includes("permission") || !keys.sorted.includes("title")) {
				return false;
			}
		})
		return true;
	}

	self.renderData = function(cb) {
		var preview_url = "https://commons.wikimedia.org/w/index.php?title=Special:ExpandTemplates&wpInput=";
		var url =  "/api/v1/collections/" + self.gp.collection + "/docs?limit=10";
		var html = "<table class='table'><thead><tr>"
		html += "<th scope='col'>#</th>"
		html += "<th>title</th>"
		html += "<th>Commons preview</th>"
		html += "<th>Pipe it!</th>"
		html += "</tr></thead><tbody>"
		$.getJSON(url, function(docs) {
			docs.data.forEach(function(doc, index) {
				var wikitext_url = encodeURIComponent(doc["wikitext"]);
				html += "<tr><th scope='row'>"+(index+1)+"</th>"
				html += "<td>" + doc["title"] + "</td>";
				html += "<td><a target='_blank' href='" + preview_url + wikitext_url + "'>Preview</a></td>"
				html += "<td><button type='button' class='btn btn-primary upload' data-id='"+doc["_id"]+"'>Upload!</button></td></tr>";
				//html += "<tr><th scope='row'>"+(index+1)+"</th><td>" + doc["title"] + "</td><td><a href=''>preview</a></td></tr>"
			})
			html += "</tbody></table>";
			$("#items").append(html);
			self.checkFilePath(docs);

		})
	}

	self.checkFilePath = function(docs) {
		if(docs.data[0][self.fileField] && Array.isArray(docs.data[0][self.fileField])) {
			if(docs.data[0][self.fileField][0].includes("http")) {
				
				self.createPipeLine();
			} else {
				
			}
		}
	}



	self.socket.on('progress', function (data) {
		//if(data.project == gp.currentProject) {
			//progressDisplay.append("<div class='alert alert-info'>" + data.msg + "</div>");
		//}
	});

	self.socket.on('error', function (data) {
		//if(data.project == gp.currentProject) {

			self.progressDisplay.empty().append("<div class='bad'>" + data.msg + "</div>");

		//}
		//websockPopup(progressDisplay, "Node run error");
	});

	self.socket.on('finish', function (data) {
		console.log(data)
		//if(data.project == gp.currentProject && data.node_uuid == gp.currentlyOpenNode.source._id) {
			self.progressDisplay.empty().append("<div class='alert alert-success'>" + data.msg + "</div>");
		//}
	});



}

// nasty globals set by ajax functions
var globals = {
	project: null,
	collection: null,
	filename: null,
	headers: null,
	node: null,
	errors: []
}


// CSV-project
function createCSVProject (gp, project_title) {
	return gp.createProject(project_title)
		.then(createCollection)
		.then(createCSVImportNode)
		.then(function(data){
			config.nodes.csv.id = data.id;
			return runNode(config.nodes.csv);
		})
		.then(function(data) {
			return createNode(config.nodes.map)
		})
		.then(function(data) {
			config.nodes.map.id = data.id;
			return createPipeLine();
		})
		.catch(function(status) {
			alert("Did not work! Computer says: " + status );
			//throw("error!");
		});
}




function createPipeLine() {
	return createNode(config.nodes.download)
		.then(function(data) {
			return createNode(config.nodes.checksum)
		})
		.then(function(data) {
			return createNode(config.nodes.check_if_commons)
		})
		.then(function(data) {
			return createNode(config.nodes.commons_upload)
		})
		.catch(function(status) {
			alert("Did not work! Computer says: " + status );
			//throw("error!");
		});
}





function upload(cb) {
	var formData = getFormData();
	$.ajax({
	url: "http://localhost:3000/api/v1/upload", // Url to which the request is send
	type: "POST",             // Type of request to be send, called as method
	data: formData, // Data sent to server, a set of key/value pairs (i.e. form fields and values)
	contentType: false,       // The content type used when sending data to the server.
	cache: false,             
	processData:false,        
	success: function(data) {
		cb(data);
		$('#loading').hide();
		$("#message").html(data);
	}
	});
}



function getFormData() {
	// read form for file upload
	var form = $("#uploadfile")[0];
	var fd = new FormData(form);
	return fd;
}


