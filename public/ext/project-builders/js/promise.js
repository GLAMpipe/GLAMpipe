var items = [];

// add put to JQuery
$.put = function(url, data, callback, type){
 
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
		contentType: type
	});
}

//var gpurl = "http://siljo.lib.jyu.fi:8080"
var gpurl = "http://localhost:3000"
var apiurl = gpurl + "/api/v1";


var fetchJSON = function(url) {  
	return new Promise((resolve, reject) => {
		$.getJSON(url)
		.done((json) => resolve(json))
		.fail((xhr, status, err) => reject(status + err.message));
	});
} 

var put = function(url, data) {  
	return new Promise((resolve, reject) => {
		$.put(url, data)
			.done(function(json){console.log("PUT done");resolve(json)})
			.fail((xhr, status, err) => reject(status + err.message));
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



$( document ).ready(function() {

	// nasty globals
	var project = null;
	var collection = null;
	var filename = null;

	function createURL(id, type1, type2) {
		var projects = apiurl + "/projects";
		
		switch (type1) {
			case "project":
				$("#items").append("<div>Luon projektia...</div>");
				return projects;
				
			case "collection":
				$("#items").append("<div>Projekti tehty!</div>");
				$("#items").append("<div>Luon kokoelmaa...</div>");
				return projects + "/" + id + "/nodes/collection_basic?type=collection";

			case "upload":
				$("#items").append("<div>Kokoelma tehty!</div>");
				$("#items").append("<div>Lataan tiedostoa ...</div>");
				return apiurl + "/upload";

			case "delete":
				$("#items").append("<div>Poistetaan tiedostoa ...</div>");
				return apiurl + "/upload/" + id;
			
			case "node":
				$("#items").append("<div>Tiedosto ladattu!</div>");
				$("#items").append("<div>Luon PDF import nodea ...</div>");
				return projects + "/" + project + "/nodes/" + type2;
				
			case "run-node":
				$("#items").append("<div>Node luotu!</div>");
				$("#items").append("<div>Suoritan nodea ...</div>");
				return apiurl + "/nodes/" + id + "/run";

			case "data":
				$("#items").append("<div>Node ajettu!</div>");
				$("#items").append("<div>Haen dataa ...</div>");
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
			processData:false
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
			dataType: "json"
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


	function runPDFImportNode(data) {
		var url = createURL(data.id, "run-node")
		var d = {
			url: url,
			type: "POST",
			dataType: "json",
		}
		return post(d).then(function(data) {
			if(data.error) throw("Import ei onnistunut!");
			return data;
		})
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


	function runAnnifNode(data) {

		var url = createURL(data.id, "run-node");
		$("#items").append("<div>... ihan jännittää miten tässä käy ...</div>");
		var language = $("#language").val();
		var settings = {
			maxhits:	"12",
			threshold:	"0.45",
			lines: 		"1000",
			project:	language
		}
		var d = {
			url: url,
			data: JSON.stringify(settings),
			type: "POST",
			dataType: "json",
			contentType: "application/json; charset=utf-8"
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

	function callGP (project_title) {
		return createProject(project_title)
			.then(createCollection)
			.then(uploadFile)
			.then(createPDFImportNode)
			.then(runPDFImportNode)
			.then(deleteFile)
			.then(createAnnifNode)
			.then(runAnnifNode)
			.then(getAnnifData)
			.catch(function(status) {
				alert("Nyt ei onnistu! Computer says: " + status );
				throw("Ei pysty!");
				});
	}


	function failFunction(status) {
		$("#items").append("<div>" + status + "</div>");
		
	}

	
	$("#login").click(function() {
		var login = {
			email: "arttu",
			password: "naksu2"
		}
		var d = {
			url: apiurl + "/login",
			data: login,
			type: "POST",
			dataType: "json"
		}
		post(d).then(function(data) {
			if(data.error) throw("Kirjautuminen ei onnistunut!");
		})
		
	})
	
	$("#fetch").click(function() {

		var date = new Date();
		var project_title = "ANNIF_" + date.toISOString();

		var formData = getFormData();
		if(formData.get("file").name == "") {
			alert("Valitse tiedosto!");
		} else {
			callGP(project_title).then(function(data) {
				$("#items").append("<div>Projekti valmis!</div><a target='_blank' href='"+gpurl+"/project/" + project + "'><button>avaa</button>");
				renderTable(data);
			})
			.catch(failFunction);
		}
	})

});

function renderTable(data) {

	var html = "<h4>Asiasanat</h4><table>";
	html += "<tr><th>asiasana</th><th>YSO</th><th>pisteet</th></tr>"
	var plain_subjects = [];
	
	var subjects = data.data[0].suggested_subjects;
	for(var i = 0; i < subjects.length; i++) {
		html += "<tr>";
		html += "<td>" + subjects[i].label + "</td>";
		html += "<td><a target='_blank' href='" + subjects[i].uri + "'>linkki</a></td>";
		html += "<td>" + subjects[i].score + "</td>";
		html += "</tr>";
		
		plain_subjects.push(subjects[i].label);
	}
	
	html += "</table>";
	$("#items").empty();
	$("#subjects").empty().append(html);
	$("#plain-subjects").empty().append("<h4>Asiasanat</h4><textarea rows='20' class='form-control'>" + plain_subjects.join("\n") + "</textarea>");

	
	html = "<h4>PDF:n tiedot</h4><table>";
	html += "<tr><th>field</th><th>info</th></tr>"
	var info = data.data[0].info;
	for(field in info) {
		html += "<tr>";
		html += "<td>" + field + "</td>";
		html += "<td>" + info[field] + "</td>";
		html += "</tr>";
	}
	html += "</table>";
	
	$("#pdf-info").empty().append(html);

}

function renderMetadata(item) {


	// hide search result
	$("#items, #jyx-info").hide();
	$("#jyx-input").removeClass("hidden");
	
}



	//var d = {title:"koe1"}
	//var createProject = Promise.resolve($.put( "http://localhost:3000/api/v1/projects", d ));

	//var s = $.get( "http://localhost:3000/api/v1/projects", d );
	//var createCollection = Promise.resolve(s);

