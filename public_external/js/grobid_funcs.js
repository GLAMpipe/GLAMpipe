

// nasty globals set by ajax functions
var globals = {
	project: null,
	collection: null,
	filename: null,
	headers: null
}


function createURL(id, type1, type2) {
	var projects = apiurl + "/projects";
	
	switch (type1) {
		case "project":
			$("#items").append("<div class='alert alert-info'>Luon projektia...</div>");
			return projects;
			
		case "collection":
			$("#items").append("<div class='alert alert-success'>Projekti tehty!</div>");
			$("#items").append("<div class='alert alert-info'>Luon kokoelmaa...</div>");
			return projects + "/" + id + "/nodes/collection_basic?type=collection";

		case "upload":
			$("#items").append("<div class='alert alert-success'>Kokoelma tehty!</div>");
			$("#items").append("<div class='alert alert-info'>Lataan tiedostoa ...</div>");
			return apiurl + "/upload";

		case "delete":
			$("#items").append("<div class='alert alert-info'>Poistetaan tiedostoa ...</div>");
			return apiurl + "/upload/" + id;
		
		case "node":
			$("#items").append("<div class='alert alert-success'>Tiedosto ladattu!</div>");
			$("#items").append("<div class='alert alert-info'>Luon PDF import nodea ...</div>");
			return projects + "/" + project + "/nodes/" + type2;
			
		case "run-node":
			$("#items").append("<div class='alert alert-success'>Node luotu!</div>");
			$("#items").append("<div class='alert alert-info'>Suoritan nodea ...</div>");
			return apiurl + "/nodes/" + id + "/run";

		case "data":
			$("#items").append("<div class='alert alert-success'>Node ajettu!</div>");
			$("#items").append("<div class='alert alert-info'>Haen dataa ...</div>");
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
		project = data.project._id; // global project id 
		return data;
	})
}

function createCollection(data) {
	var url = createURL(data.project._id, "collection")
	var d = {title:"text"};
	return put(url, d).then(function(data) {
		console.log(data)
		if(data.error) throw("Kokoelmaa ei voitu tehdä!");
		collection = data.collection;
		return data;
	})
}

function createPDFImportNode(data) {
	var url = createURL(project, "node", "source_file_pdf")
	var params = {
		file: "filu",
		filename:filename
	}
	var d = {
		collection: collection, 
		params: params
	};
	console.log(d)
	return put(url, d).then(function(data) {
		console.log(data);
		if(data.error) throw(error_msg);
		return data;
	})
}


function runNode(data) {
	var url = createURL(data.id, "run-node")
	var d = {
		url: url,
		type: "POST",
		dataType: "json",
		headers: globals.headers
	}
	return post(d).then(function(data) {
		if(data.error) throw("Import ei onnistunut!");
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


function getFormData() {
	// read form for file upload
	var form = $("#uploadfile")[0];
	var fd = new FormData(form);
	return fd;
}




	function createAnnifNode(data) {
		var url = createURL(project, "node", "process_lookup_web_annif")
		var params = {
			in_field: "text",
			out_field:"suggested_subjects"
		}
		var d = {
			collection: collection, 
			params: params
		};
		console.log(d)
		return put(url, d).then(function(data) {
			console.log(data);
			if(data.error) throw(error_msg);
			return data;
		})
	}


	function createGrobidNode(data) {
		var url = createURL(project, "node", "process_file_pdf_grobid")
		var params = {
			in_field: "text",
			out_field:"suggested_subjects"
		}
		var d = {
			collection: collection, 
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

		var url = createURL(data.id, "run-node");
		$("#items").append("<div>... ihan jännittää miten tässä käy ...</div>");
		var language = $("#language").val();
		var settings = {
			maxhits:	maxhits,
			threshold:	"0.45",
			lines: 		"1000",
			project:	language
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

	function getAnnifData() {
		var url = createURL(collection, "data")
		return fetchJSON(url).then(function(data) {
			if(data.error) throw("Asiasanojen hakeminen ei onnistunut!");
			return data;
		})
	}
