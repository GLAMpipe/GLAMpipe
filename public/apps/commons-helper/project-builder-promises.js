

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
function createCSVProject (project_title) {
	return createProject(project_title)
		.then(createCollection)
		.then(uploadFile)
		.then(createCSVImportNode)
		.then(runNode)
		.catch(function(status) {
			alert("Did not work! Computer says: " + status );
			throw("error!");
			});
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



function uploadFile(formData) {
	var formData = getFormData();
	var url = createURL(null, "upload");
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
	
	return post(d).then(function(data) {
		if(data.error) throw("Tiedostoa ei voitu ladata!");
		filename = data.filename;
		console.log(data)
		return data;
	})		
}


function deleteFile(formData) {
	var url = createURL(filename, "delete");
	var d = {
		url: url,
		type: "DELETE",
		dataType: "json",
		headers: globals.headers
	}
	
	return post(d).then(function(data) {
		if(data.error) throw("Tiedostoa ei voitu poistaa!");
		return data;
	})		
}


function createProject(title) {
	console.log("calling createProject");
	var d = {title:title};
	var url = createURL(null, "project");
	console.log(url);
	return put(url, d).then(function(data) {
		console.log(data);
		if(data.error) throw(data.error);
		globals.project = data.project._id; // global project id 
		return data;
	})
}

function createCollection(data) {
	var url = createURL(data.project._id, "collection")
	var d = {title:"text"};
	return put(url, d).then(function(data) {
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
	return put(url, d).then(function(data) {
		console.log(data);
		if(data.error) throw(error_msg);
		globals.node = data;
		return data;
	})
}


function createPDFImportNode(data) {
	var url = createURL(globals.project, "node", "source_file_pdf")
	var params = {
		file: "filu",
		filename:filename
	}
	var d = {
		collection: globals.collection, 
		params: params
	};
	console.log(d)
	return put(url, d).then(function(data) {
		console.log(data);
		if(data.error) throw(error_msg);
		globals.node = data;
		return data;
	})
}


function createPDF2ImageNode(data) {
	var url = createURL(globals.project, "node", "process_file_pdf2image")
	var params = {
		out_field: "pdf2image",
		in_field:"file"
	}
	var d = {
		collection: globals.collection, 
		params: params
	};
	console.log(d)
	return put(url, d).then(function(data) {
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

function showPDFCover() {
	var splitted = globals.node.result.value.split("/");
	var file = splitted[splitted.length - 1];
	var html = "<img src='" + apiurl + "/nodes/" + globals.node.id + "/files/" + file + "'/>";
	$("#cover").empty().append(html);
	$("#accordion-kuva").collapse("show");

}


function runNode(data) {
	var url = createURL(data.id, "run-node", data.node.title)
	var d = {
		url: url,
		type: "POST",
		dataType: "json",
		headers: globals.headers
	}
	return post(d).then(function(data) {
		if(data.error) throw("Import ei onnistunut!");
		globals.node.result = data.result;
		return data;
	})
}




function getFormData() {
	// read form for file upload
	var form = $("#uploadfile")[0];
	var fd = new FormData(form);
	return fd;
}




function createAnnifNode(data) {
	var url = createURL(globals.project, "node", "process_lookup_web_annif")
	var params = {
		in_field: "text",
		out_field:"suggested_subjects"
	}
	var d = {
		collection: globals.collection, 
		params: params
	};
	console.log(d)
	return put(url, d).then(function(data) {
		console.log(data);
		if(data.error) throw(error_msg);
		return data;
	})
}

function createGROBIDNode(data) {
	var url = createURL(globals.project, "node", "process_file_grobid")
	var params = {
		in_field: "file",
		out_field:"references",
		grobid_url:"http://localhost:8080"
	}
	var d = {
		collection: globals.collection, 
		params: params
	};
	console.log(d)
	return put(url, d).then(function(data) {
		console.log(data);
		if(data.error) throw(error_msg);
		return data;
	})
}


function runAnnifNode(data) {

	var languages = ["fi", "en", "sv"];
	var lang = globals.node.result.value;
	if(!Array.isArray(lang) && !lang[0]) {
		globals.errors.push("Kielen tunnistus ei onnistunut!");
		//throw("Kielen tunnistus ei onnistunut!");
	}
	lang = lang[0];
	if(languages.indexOf(lang) === -1)
		globals.errors.push("Kieli jota ANNIF ei osaa! " + lang);
		
	lang = "yso-finna-" + lang;
		
	var url = createURL(data.id, "run-node", "Annif-asiasanoitus");
	$("#items").append("<div>... ihan jännittää miten tässä käy ...</div>");
	var language = $("#language").val();
	var settings = {
		maxhits:	maxhits,
		threshold:	"0.45",
		lines: 		"1000",
		project:	lang
	}
	var d = {
		url: url,
		data: JSON.stringify(settings),
		type: "POST",
		dataType: "json",
		contentType: "application/json; charset=utf-8",
		headers: globals.headers
	}
	return post(d).then(function(data) {
		if(data.error) throw("Asiasanojen hakeminen ei onnistunut!");
		return data;
	})
}

function getData() {
	var url = createURL(globals.collection, "data")
	return fetchJSON(url).then(function(data) {
		if(data.error) throw("Datan ei onnistunut!");
		return data;
	})
}



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
