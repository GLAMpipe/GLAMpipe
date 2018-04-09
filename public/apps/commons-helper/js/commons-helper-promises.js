

function Helper() {
	var self = this;
	self.gp = new GLAMpipe();
	
	self.filename = null;

	self.createCSVProject = function(title) {
		return self.gp.createProject(title)
			.then(function(data) {
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
			.catch(function(status) {
				alert("Did not work! Computer says: " + status );
				//throw("error!");
			});
	}
	
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


function createWikitext() {
	return runNode(config.nodes.map)
		.then(function(data) {
			console.log("joo")
		})
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


function renderData() {
	var preview_url = "https://commons.wikimedia.org/w/index.php?title=Special:ExpandTemplates&wpInput=";
	var url =  apiurl + "/collections/" + globals.collection + "/docs?limit=10";
	var html = "<table class='table'><thead><tr><th scope='col'>#</th><th>title</th><th>How does it look like in Commons?</th></tr></thead><tbody>"
	$.getJSON(url, function(docs) {
		docs.data.forEach(function(doc, index) {
			var wikitext_url = encodeURIComponent(doc["wikitext"]);
			html += "<tr><th scope='row'>"+(index+1)+"</th><td>" + doc["title"] + "</td>";
			html += "<td><a target='_blank' href='" + preview_url + wikitext_url + "'>Preview</a></td></tr>";
			//html += "<tr><th scope='row'>"+(index+1)+"</th><td>" + doc["title"] + "</td><td><a href=''>preview</a></td></tr>"
		})
		html += "</tbody></table>";
		$("#items").append(html);
	})
}

function createURL(id, type1, type2) {
	var projects = apiurl + "/projects";
	$("#upload-status").empty();
	
	switch (type1) {
		case "project":
			$("#upload-status").append("<div class='alert alert-info'>Luon projektia...</div>");
			return projects;
			
		case "collection":
			$("#upload-status").append("<div class='alert alert-success'>Projekti tehty!</div>");
			$("#upload-status").append("<div class='alert alert-info'>Luon kokoelmaa...</div>");
			return projects + "/" + id + "/nodes/collection_basic?type=collection";

		case "upload":
			$("#upload-status").append("<div class='alert alert-success'>Kokoelma tehty!</div>");
			$("#upload-status").append("<div class='alert alert-info'>Lataan tiedostoa ...</div>");
			return apiurl + "/upload";

		case "delete":
			$("#upload-status").append("<div class='alert alert-info'>Poistetaan tiedostoa ...</div>");
			return apiurl + "/upload/" + id;
		
		case "node":
			$("#upload-status").append("<div class='alert alert-success'>Tiedosto ladattu!</div>");
			$("#upload-status").append("<div class='alert alert-info'>Luon nodea "+type2+"...</div>");
			return projects + "/" + globals.project + "/nodes/" + type2;
			
		case "run-node":
			$("#upload-status").append("<div class='alert alert-info'>Suoritan nodea <strong>" + type2 + "</strong>...</div>");
			return apiurl + "/nodes/" + id + "/run";

		case "data":
			$("#upload-status").append("<div class='alert alert-success'>Node ajettu!</div>");
			$("#upload-status").append("<div class='alert alert-info'>Haen dataa ...</div>");
			return apiurl + "/collections/" + id + "/docs";
	}
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


function uploadFile(formData) {
	var formData = getFormData();
	var url = createURL(null, "upload");
	console.log(url)
	var d = {
		url: url,
		type: "POST",
		dataType: "json",
		data:  formData,
		contentType: false, 
		cache: false,
		processData:false,
		headers: globals.headers
	}
	console.log(d)
	return post(url, formData).then(function(data) {
		//if(data.error) throw("Tiedostoa ei voitu ladata!");
		//filename = data.filename;
		//console.log(data)
		return data;
	})		
}




function createCollection(data) {
	var url = createURL(data.project._id, "collection")
	var d = {params:{title:"text"}};
	return post2(url, d).then(function(data) {
		console.log(data)
		if(data.error) throw("Kokoelmaa ei voitu tehdä!");
		globals.collection = data.collection;
		return data;
	})
}


function createCSVImportNode(data) {
	var url = createURL(globals.project, "node", "source_file_csv")
	var params = {
		file: "filu",
		filename:filename
	}
	var d = {
		collection: globals.collection, 
		params: params
	};
	console.log(d)
	return post2(url, d).then(function(data) {
		console.log(data);
		if(data.error) throw(error_msg);
		globals.node = data;
		return data;
	})
}





function createLanguageDetectionNode(data) {
	var url = createURL(globals.project, "node", "process_field_detect_language")
	var params = {
		out_field: "detected_lang",
		in_field:"text"
	}
	var d = {
		collection: globals.collection, 
		params: params
	};
	return put(url, d).then(function(data) {
		console.log(data);
		if(data.error) throw(error_msg);
		globals.node = data;
		return data;
	})
}

function createNode(node) {
	var url = apiurl + "/projects/" + globals.project + "/nodes/" + node.nodeid;
	var d = {
		collection: globals.collection, 
		params: node.params
	};
	return post2(url, d).then(function(data) {
		console.log(data);
		//if(data.error) throw(error_msg);
		return data;
	})
}



function runNode(node) {
	var url = createURL(node.id, "run-node", node.id)
	var d = {
		url: url,
		type: "POST",
		dataType: "json",
		data: node.settings,
		headers: globals.headers
	}
	return post(d).then(function(data) {
		if(data.error) throw("Failure in node run!");
		return data;
	})
}




function getFormData() {
	// read form for file upload
	var form = $("#uploadfile")[0];
	var fd = new FormData(form);
	return fd;
}





/*
// add put to JQuery
$.put = function(url, data, headers, callback, type){
 
	if ( $.isFunction(data) ){
		type = type || callback,
		callback = data,
		data = {}
	}
 
	return $.ajax({
		url: url,
		type: 'PUT',
		success: callback,
		data: data,
		contentType: type,
		headers: headers
	});
}


var fetchJSON = function(url) {  
	return new Promise((resolve, reject) => {
		$.getJSON(url)
		.done((json) => resolve(json))
		.fail((xhr, status, err) => reject(status + err.message));
	});
} 

var put = function(url, data) {  
	return new Promise((resolve, reject) => {
		$.put(url, data, globals.headers)
			.done(function(json){console.log("PUT done");resolve(json)})
			.fail((xhr, status, err) => reject(xhr + status + err.message));
	});
} 

var post = function(data) {  
	return new Promise((resolve, reject) => {
		$.ajax(data)
			.done(function(json) { 
				console.log("POST status:" + json.status)
				if(json.status == "error")
					reject(json.status);
				else
					resolve(json)
				})
			.fail((xhr, status, err) => reject(status + err.message));
	});
} 

var post2 = function(url, data) {  
	return new Promise((resolve, reject) => {
		$.post(url, data)
			.done(function(json) { 
				console.log("POST status:" + json.status)
				if(json.status == "error")
					reject(json.status);
				else
					resolve(json)
				})
			.fail((xhr, status, err) => reject(status + err.message));
	});
} 
*/
