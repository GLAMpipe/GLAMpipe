var c = context; 

if(!context.error && context.response.statusCode == 200) {

	var data = context.parser.toJson(c.data);
	var json = JSON.parse(data);
	var id = json.eprints.eprint.id;
	var date = "";
	var source = "";
	var type = "";
	
	if(json.eprints.eprint.date)
		date = json.eprints.eprint.date;

	if(json.eprints.eprint.source)
		source = json.eprints.eprint.source;

	if(json.eprints.eprint.type)
		type = json.eprints.eprint.type;

	out.value = {
		"id": id,
		"title": [],
		"title__lang": [],
		"abstract": [],
		"abstract__lang": [],
		"creators": [],
		"date": date,
		"source": source,
		"type": type,
		"file_url": "",
		"file_mime": "", 
		"all_files": []
		};
	
	getFiles();
	getTitles();
	getAbstracts();
	getCreators();
	getLocation();

    context.vars.success_count++;


} else {
    out.value = null;
    context.skip = true;
}


if(!(context.vars.success_count % 10)) 
	out.say("progress", context.vars.success_count + " imported");








function getFiles() {
    if(json.eprints.eprint.documents && json.eprints.eprint.documents.document) {
		
		var documents = json.eprints.eprint.documents.document;
		documents.forEach(function(doc) {
			if(doc.files &&  doc.files.file) {
				out.value.all_files.push(doc.files.file);
				// the main file has no relations?
				if(!doc.relation) {
					out.value.file_url = doc.files.file.url;
					out.value.file_mime = doc.files.file.mime_type;
					out.value.file_name = doc.files.file.filename;
					out.value.file_security = doc.security;
				}
					
			}
		})

	}
}

function getTitles() {
	var prop = "ml_title";
	if(json.eprints.eprint[prop]) {
		if(Array.isArray(json.eprints.eprint[prop].item)) {
			json.eprints.eprint[prop].item.forEach(function(title) {
				out.value.title.push(title.text);
				out.value.title__lang.push(title.lang);
			}) 

		} else {
			out.value.title.push(json.eprints.eprint[prop].item.text);
			out.value.title__lang.push(json.eprints.eprint[prop].item.lang)
		}
	} else {
		if(json.eprints.eprint.title)
			out.value.title.push(json.eprints.eprint.title);
	}
}

function getAbstracts() {
	var prop = "ml_abstract";
	if(json.eprints.eprint[prop]) {
		if(Array.isArray(json.eprints.eprint[prop].item)) {
			json.eprints.eprint[prop].item.forEach(function(title) {
				out.value.abstract.push(title.text);
				out.value.abstract__lang.push(title.lang);
			}) 

		} else {
			out.value.abstract.push(json.eprints.eprint[prop].item.text);
			out.value.abstract__lang.push(json.eprints.eprint[prop].item.lang)
		}
	} else {
		if(json.eprints.eprint.abstract)
			out.value.abstract.push(json.eprints.eprint.abstract);
	}
}

function getCreators() {
	if(json.eprints.eprint.creators) {
		if(Array.isArray(json.eprints.eprint.creators.item)) {
			json.eprints.eprint.creators.item.forEach(function(item) {
				out.value.creators.push(combine(item.name.family, item.name.given));
			}) 

		} else {
			out.value.creators.push(combine(json.eprints.eprint.creators.item.name.family, json.eprints.eprint.creators.item.name.given));
		}
	} 
}


function getLocation() {
	if(json.eprints.eprint.latitude)
		out.value.latitude = json.eprints.eprint.latitude;
	if(json.eprints.eprint.longitude)
		out.value.longitude = json.eprints.eprint.longitude;
}

function combine(a, b) {
	if(a && b)
		return a + " " + b;
	else if(b)
		return b;
	else if(a)
		return a;
		
	return "";
}
