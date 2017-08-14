

// nasty globals set by ajax functions
var globals = {
	project: null,
	collection: null,
	filename: null,
	original_filename: null,
	headers: null,
	node: null,
	errors: [],
	i18n: {
		"fi": {
			"not-pdf":"Tiedosto ei ole PDF!"
		},
		"en": {
			"not-pdf":"File is not PDF!"
		}
	}
}

var metadataPipe = {
	// DSpace: create item
	dspace_item: {
		parameters: {
			params: {
				url:"http://siljo.lib.jyu.fi:8080/rest",
				out_uuid:"dspace_uuid",
				out_handle:"dspace_handle",
				out_link:"dspace_link",
				dspace_ui:"/xmlui"
			},
			collection: function() {return globals.collection}
		},
		settings: {
			username:	"ari.hayrinen@gmail.com",
			password:	"naksu2",
			collection: "a764986b-a75a-40df-9eeb-7e0caeab9bd6", // INBOX
			rest_data:	"metadata"
		}
	},
	
	dspace_file:{
		parameters: {
			params: {
				url:"http://siljo.lib.jyu.fi:8080/rest",
				in_uuid: "dspace_uuid", // INBOX
				in_file: "file",
				in_file_title:	"original_filename",
				out_field: "dspace_upload_response",
				out_link: "dspace_upload_link"
			},
			collection: function() {return globals.collection}
		},
		settings: {
			username:	"ari.hayrinen@gmail.com",
			password:	"naksu2"
		}
	}
}

// ANNIF -asiasanoitus
function createANNIFProject (project_title) {
	return createProject(project_title)
		.then(createCollection)
		.then(uploadFile)
		.then(createPDFImportNode)
		.then(runNode)
		.then(deleteFile)
		.then(createLanguageDetectionNode)
		.then(runNode)
		.then(createAnnifNode)
		.then(runAnnifNode)
		.then(getData)
		.catch(function(status) {
			alert("Nyt ei onnistu! Computer says: " + status );
			throw("Ei pysty!");
			});
}

// lähteiden ekstraktointi GROBIN avulla
function createGROBIDProject (project_title) {
	return createProject(project_title)
		.then(createCollection)
		.then(uploadFile)
		.then(createPDFImportNode)
		.then(runNode)
		.then(createGROBIDNode)
		.then(runNode)
		.then(deleteFile)
		.then(getData)
		.catch(function(status) {
			alert("Nyt ei onnistu! Computer says: " + status );
			throw("Ei pysty!");
		});
}

// tiedosto JYXiin
function createFile2JyxProject (project_title) {
	return createProject(project_title)
		.then(createCollection)
		.then(uploadFile)
		.then(createPDFImportNode)
		.then(runNode)
		.then(createPDF2ImageNode)
		.then(runNode)
		.then(showPDFCover)
		.then(createLanguageDetectionNode)
		.then(runNode)
		.then(createAnnifNode)
		.then(runAnnifNode)
		.then(getData)
		.catch(function(status) {
			alert("Nyt ei onnistu! Computer says: " + status );
			throw("Ei pysty!");
		});
}

function 	file2GP (file) {
	globals.node = {};
	// empty document template
	var doc = {
		"tmp_file":"", 
		"original_file":"", 
		"dc_type":"PUUTTUU!", 
		"dc_contributor_author":"PUUTTUU!", 
		"dc_contributor_advisor":"", 
		"dc_title":"PUUTTUU!", 
		"dc_subject_other":"", 
		"dc_description_abstract":"", 
		"dc_description_abstract__lang":"", 
		"urn":""
		}
	// first upload file
	return uploadFile(file)
	
		// then add document to GP
		.then(function(data) {
			console.log(file)
			if(data.mimetype && data.mimetype !== "application/pdf") {
				throw("Ei ole pdf!");
			}
			
			doc.tmp_file = data.path + "/" + data.filename;
			doc.original_file = data.originalname;
			return addDoc2GLAMpipe(globals.collection, doc)
		}) 

		// then create cover image
		.then(function(data) {
			globals.doc_id = data._id;
			return runNodeSingle(globals.nodes.pdf2image, data._id)
		})

		.catch(function(status) {
			throw(status);
		});
}

function getAnnifKeywords () {

	// then extract text
	return runNodeSingle(globals.nodes.pdf2text, globals.doc_id)

		// then detect language
		.then(function(data) {
			return runNodeSingle(globals.nodes.detectlanguage, globals.doc_id)
		}) 

		// then get YSO keywords
		.then(function(data) {
			var project = "";
			if(Array.isArray(data.result.value) && (data.result.value[0] == "en" || data.result.value[0] == "fi"))
				project = "yso-finna-" + data.result.value[0];
				
			globals.nodes.annif.settings = {"maxhits":"20", "threshold": "0.45", "project": project }
			return runNodeSingle(globals.nodes.annif, globals.doc_id)
		}) 

		.catch(function(status) {
			throw(status);
		});
}


function updateDocumentGP (metadata) {
	// update document
	console.log(metadata);
	return metadata2GLAMpipe(globals.collection, globals.doc_id, metadata)
		.catch(function(status) {
			alert("Nyt ei onnistu! Computer says: " + status );
			throw("Ei pysty!");
		});
	}		


// metatiedot GLAMpipeen
// tiedosto JYXiin
function metadataUpload (metadata) {
	// get id
	return getDocId()
		// upload metadata to GLAMpipe
		.then(function(data) {
			console.log("upload");
			console.log(data);
			var id = data.data[0]._id
			return metadata2GLAMpipe(globals.collection, id, metadata)
			
		// create DSpace export node
		}).then(function() {
			return createNode("export_web_dspace_additem", metadataPipe.dspace_item.parameters)
			
		// run DSpace export
		}).then(function(data) {
			var d = getNodeRunOptions(data, metadataPipe.dspace_item.settings)
			return post(d).then(function(data) {
				if(data.error) throw("JYX-talletus ei onnistunut!");
				return data;
			})
			
		// create DSpace export file node
		}).then(function() {
			return createNode("export_web_dspace_addfile", metadataPipe.dspace_file.parameters)
			
		// run DSpace export file node
		}).then(function(data) {
			var d = getNodeRunOptions(data, metadataPipe.dspace_file.settings)
			return post(d).then(function(data) {
				if(data.error) throw("JYX-talletus ei onnistunut!");
				return data;
			})
		})
		.catch(function(status) {
			alert("Nyt ei onnistu! Computer says: " + status );
			throw("Ei pysty!");
		});
}




function getNodeRunOptions(node, settings) {
	return {
		url: apiurl + "/nodes/" + node.id + "/run",
		data: JSON.stringify(settings),
		type: "POST",
		dataType: "json",
		contentType: "application/json; charset=utf-8",
		headers: globals.headers
	}
}

function createURL(id, type1, type2, doc_id) {
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

		case "run-node-single":
			$("#upload-status").append("<div class='alert alert-info'>Suoritan <strong>" + type2 + "</strong>...</div>");
			return apiurl + "/nodes/" + id + "/run/" + doc_id + "?force=true";

		case "data":
			$("#upload-status").append("<div class='alert alert-info'>Haen dataa ...</div>");
			return apiurl + "/collections/" + id + "/docs";

		case "metadata_upload":
			//$("#upload-status").append("<div class='alert alert-info'>Talletan ...</div>");
			return apiurl + "/collections/" + id + "/docs/" + type2;
			
		case "doc_upload":
			$("#upload-status").append("<div class='alert alert-info'>Talletan ...</div>");
			return apiurl + "/collections/" + id + "/docs/";
	}
}


// uploads file to GLAMpipe's temp
function uploadFile(formData) {
	//if(globals.doc_id)
		//throw("latasit tiedoston jo!");
		
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



function getDocId() {
	var url = apiurl + "/collections/" + globals.collection + "/docs";
	console.log(url);
	
	return fetchJSON(url).then(function(data) {
		if(data.error) throw("En saanut id-tietoa!");
		return data;
	})		
}

function addDoc2GLAMpipe(collection, doc) {
	var url = createURL(collection, "doc_upload")
	var d = {
		url: url,
		type: "PUT",
		data: JSON.stringify(doc),
		contentType: "application/json",
		headers: globals.headers
	}
	
	console.log(d)
	
	return post(d).then(function(data) {
		console.log(data)
		if(data.error) throw("Dokumenttia ei voitu lisätä!");
		return data;
	})		
}


function metadata2GLAMpipe(collection, docid, metadata) {
	console.log("metadata")
	console.log(metadata)
	var url = createURL(collection, "metadata_upload", docid)
	console.log(url)
	var d = {
		url: url,
		type: "POST",
		data: JSON.stringify(metadata),
		contentType: "application/json",
		headers: globals.headers
	}
	
	//console.log(d)
	
	return post(d).then(function(data) {
		console.log(data)
		if(data.error) throw("Tietojen lisäys ei onnistunut!");
		return data;
	})		
}


function createProject(title) {
	if(globals.project)
		return Promise.resolve();
		
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
	if(globals.collection)
		return Promise.resolve();
		
	var url = createURL(data.project._id, "collection")
	var d = {params:{title:"data"}};
	return put(url, d).then(function(data) {
		console.log(data)
		if(data.error) throw("Kokoelmaa ei voitu tehdä!");
		globals.collection = data.collection;
		return data;
	})
}


function createNode(nodetype, params) {
	var url = createURL(globals.project, "node", nodetype)
	console.log(url);
	console.log(params);

	return put(url, params).then(function(data) {
		console.log(data);
		if(data.error) throw(error_msg);
		globals.node = data;
		return data;
	})	
}

function createPDFImportNode(data) {
	var url = createURL(globals.project, "node", "source_file_pdf")
	var params = {
		file: globals.original_filename,
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
		in_field: "file"
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
	if(globals.node.result && globals.node.result.value && typeof globals.node.result.value == "string") {
		var splitted = globals.node.result.value.split("/");
		var file = splitted[splitted.length - 1];
		var html = "<img src='" + apiurl + "/nodes/" + globals.node.id + "/files/" + file + "'/>";
		$("#cover").empty().append(html);
		$("#accordion-kuva").collapse("show");
	} else {
		console.log("Kansikuvaa ei pystytty tekemään")
		$("#cover").empty().append("Kansikuvaa ei pystytty tekemään");
	}

}

function showPDFCover2(data, node_id) {
	if(data.result && data.result.value && typeof data.result.value === "string") {
		var splitted = data.result.value.split("/");
		var file = splitted[splitted.length - 1];
		var html = "<img src='" + apiurl + "/nodes/" + node_id + "/files/" + file + "'/>";
		$("#cover").empty().append(html);
		$("#accordion-kuva").collapse("show");
	} else {
		console.log("Kansikuvaa ei pystytty tekemään")
		$("#cover").empty().append("Kansikuvaa ei pystytty tekemään");
	}
}

function runNode(data) {
	console.log(data)
	var url = createURL(data.id, "run-node", data.node.title);
	console.log(url);
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



function runNodeSingle(data, id) {
	console.log(data)
	var url = createURL(data.id, "run-node-single", data.node.title, id);
	console.log(url);
	var d = {
		url: url,
		type: "POST",
		data: data.settings,
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
	//$("#items").append("<div>... ihan jännittää miten tässä käy ...</div>");
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
