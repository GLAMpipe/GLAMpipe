function getJYXData() {
	
	var item = {"metadata": []};
	
	$("#jyx-data textarea, #jyx-data input").each(function(index) {
		var value = $(this).val().split("\n");
		var field_name = $(this).prop("id").replace(/-/g, ".");
		value.forEach(function(val) {
			var field = {"key": field_name, "value": val};
			item.metadata.push(field)
		})
	})

	return item;
}


function getJYXDataArray() {
	
	var item = [];
	
	$("#jyx-data textarea, #jyx-data input").each(function(index) {
		var value = $(this).val().split("\n");
		var field_name = $(this).prop("id");
		value.forEach(function(val) {
			var field = {};
			field[field_name] = val;
			item.push(field)
		})
	})
	console.log(item);
	return item;
}

function getJYXDataDoc() {
	
	var item = {};
	item.dc_title = $("#dc-title").val();
	item.dc_contributor_author = $("#dc-contributor-author").val().split(",");
	item.dc_contributor_advisor = $("#dc-contributor-advisor").val().split(",");
	item.dc_type = $("#dc-type").val();
	
	// abstracts and their languages
	item.dc_description_abstract = [];
	item.dc_description_abstract.push($("#dc-description-abstract-en").val());
	item.dc_description_abstract.push($("#dc-description-abstract-fi").val());
	item.dc_description_abstract__lang = ["en","fi"];
	
	// subjects, date, page count and language
	item.dc_subject_other = $("#dc-subject-other").val().split(",");
	item.dc_date_issued = $("#dc-date-issued").val();
	item.dc_language_iso = $("#dc-language-iso").val();
	item.dc_description = $("#dc-description").val();
	
	// selected ANNIF keywords
	var ysot = []
	$(".ysot div.selected").each(function() {
		ysot.push($(this).text())
	})
	item.dc_subject_ysa = ysot;

	item.publish_permission = $("#publish-permission:checked").val();

	// contract research
	item.contractresearch = $("#contractresearch:checked").val();
	item.contractresearch_collaborator = [];
	$("input[name='contractresearch_collaborator']:checked").each(function() {
		item.contractresearch_collaborator.push($(this).val());
	});
	item.contractresearch_funding = $("#contractresearch-funding").val();
	item.contractresearch_initiative = $("input[name='contractresearch-initiative']:checked").val()

	return item;
}



function fetchRecord(item) {
	
	// hide search result

	var url = finnaurl + "/record?id=" + item.id + "&prettyPrint=true";   
	var isbn_or_id = $("#search").val();
	$("#items").empty();
	$("#jyx-input").addClass("hidden");
	
	$.getJSON(url, function(result) {
		console.log(result);
		if(result.resultCount) {
			fillJYXForm(result.records[0]);
			$("#jyx-info").hide();
			$("#jyx-data").show();
			$(".tallentaminen").show();
			//renderSelectedItem(result.records[0]);
		} else {
			$("#fetch-info").html("Ei löytynyt mitään!");
			$("#jyx-info").empty();
		}

	})
}


function renderPDFinfo(data) {
	html = "<table>";
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

function renderTable(data) {

	var html = "<ul>";
	var plain_subjects = [];
	
	var subjects = data.data[0].suggested_subjects;
	for(var i = 0; i < subjects.length; i++) {
		//html += "<tr>";
		html += "<li>" + subjects[i].label + "</li>";
		//html += "<td><a target='_blank' href='" + subjects[i].uri + "'>linkki</a></td>";
		//html += "<td>" + subjects[i].score + "</td>";
		//html += "</tr>";
		
		plain_subjects.push(subjects[i].label);
	}
	
	html += "</ul>";
	$("#items").empty();
	$("#subjects").empty().append(html);
	$("#annif-data").empty().append("<h4>Asiasanat</h4><textarea rows='20' class='form-control'>" + plain_subjects.join("\n") + "</textarea>");
	
	$("#annif").append(html);
	$("#accordion-annif").collapse("show");
	
}

function renderFinnaTable(data) {

	var html = "<table>";
	html += "<tr><th>nimi</th><th>kirjoittaja</th><th>formaatti</th><th>building</th><th>FINNA</th><th>linkit</th><th>nappi</th></tr>"

	for(var i = 0; i < data.length; i++) {
		html += "<tr>";
		//html += "<td>" + getImage(data[i]) + "</td>";
		html += "<td>" + data[i].title;
		if(data[i].id.indexOf("jyx") != -1)
			html += "  <div class='info'>" + data[i].id + "</div>";
		else
			html += "  <div>" + data[i].id + "</div>";
		html += "</td>";
		html += "<td>" + getAuthors(data[i]) + "</td>";
		html += "<td>" + getFormats(data[i]) + "</td>";
		html += "<td>" + getBuildings(data[i]) + "</td>";
		html += "<td><a target='_blank' href='https://finna.fi/Record/" + data[i].id + "'>finna</a></td>";
		html += "<td>" + getLinks(data[i]) + "</td>";
		//var button = $()
		html += "<td><button class='open' id='"+data[i].id+"'>metatiedot</button></td>";
		html += "</tr>";
		
	}
	html += "</table>";
	$("#finna").empty().append(html);
	
}

function renderSelectedItem(data) {
	$("#jyx-data").empty();
	var html = "<table><tr><th>kenttä</th><th>arvo</th></tr>";
	for(key in data) {
		html += "<tr><td>" +key+ "</td>";
		var value = data[key];
		html += "<td>";
		if(Array.isArray(value)) {

			value.forEach(function(row) {
				if(Array.isArray(row)) {
					row.forEach(function(row2) {
						html += "<li>"+row2 + "</li>";
					})

				} else if(typeof row !== "string" ) {
					for(k in row) {
						html += "<li>" + k + ":" +row[k] + "</li>";
					}
				}

			})
		} else  {
			html += data[key];
		}
		html += "</td></tr>";
	}
	html += "</table>";
	$("#jyx-data").append(html);
	$("#jyx-data").show();
	$("#jyx-data").append("<div><button class='btn-primary' id='"+data.id+"'>valitse tämä</button></div>");
}

function fillJYXForm(record) {
	var subjects = getSubjects(record);
	$("#dc-subject-other").val(subjects.sort().join("\n"));
	matchSubjects(subjects);
	$("#dc-title").val(record.title);
	$("#dc-contributor-author").val(getAuthors(record));
}

// merkitse asiasanaosumat
function matchSubjects(subjects) {
	$("#annif li").each(function() {
		if(subjects.indexOf($(this).text()) !== -1)
			$(this).addClass("bold");
	})
}

function JYXwarning (data) {
	$("#jyx-info").empty();
	for(var i = 0; i < data.length; i++) {
		if(data[i].id.indexOf("jyx") != -1)
			$("#jyx-info").append("Tämä ISBN on jo JYXissä! Katso vaikka: " + getLinks(data[i]));
	}	
}


function getAuthors(item) {
	// "kirjoittaja"
	var authors = [];
	if(Array.isArray(item.nonPresenterAuthors)) {
		item.nonPresenterAuthors.forEach(function(author) {
			if(author.name)
				authors.push(author.name);
			
		})
	}
	return authors;
}

function getSubjects(item) {
	var subjects = [];
	if(Array.isArray(item.subjects)) {
		item.subjects.forEach(function(subject) {
			if(subject[0])
				subjects.push(subject[0]);
		})
	}
	return subjects;
}

function getFormats(item) {
	var formats = [];
	if(Array.isArray(item.formats)) {
		item.formats.forEach(function(format) {
			if(format.translated)
				formats.push(format.translated);
		})
	}
	return formats;
}

function getBuildings(item) {
	var buildings = [];
	if(Array.isArray(item.buildings)) {
		item.buildings.forEach(function(subject) {
			if(subject.value)
				buildings.push(subject.value);
		})
	}
	return buildings;
}

function getLinks(item) {
	if(Array.isArray(item.urls)) {
		var html = "";
		item.urls.forEach(function(url) {
			var splitted = url.url.split("://")[1];
			var link_name = splitted.split("/")[0]
			html += "<a href='" + url.url + "' target='_blank'>" + link_name + "</a>";
		})
		return html;
	}
	return "";
}


function displayCollections (data, type, indent) {
	var html = "";
	for(var i = 0; i < data.length; i++) {
		if(type === "community")
			html += "<option disabled class='"+type+"' value='" + data[i].id + "'>" + Array(indent).join("-") + data[i].name;
		else
			html += "<option class='"+type+"' value='" + data[i].id + "'>" + Array(indent).join("-") + data[i].name;
			
		
		// handle subcommunities array
		var p = indent + 1;
		if(data[i].community && data[i].community.constructor.name == "Array" ) {
				html += displayCollections(data[i].community, "community",  p);
		// handle single subcommunity
		} else if (data[i].community) {
				html += displayCollections([data[i].community], "community", p);
		}

		// handle collections array
		if(data[i].collection && data[i].collection.constructor.name == "Array" ) {
				html += displayCollections(data[i].collection, "collection", p);
		// handle single collection
		} else if (data[i].collection) {
				html += displayCollections([data[i].community], "collection", p);
		}

		html += "</option>";
	}
	return html;
	
	
}

function renderYSOt(data) {
	if(Array.isArray(data.result.value)) {
		var ysot = "<div class='ysot'>";
		for(var i=0; i < data.result.value.length; i++) {
			
			ysot += "<div>" + data.result.value[i].label + "</div>";
		}
		ysot += "</div>";
		$("#annif").empty().append(ysot);
		
	}
}

function addSubject(subject) {
	var subjects = $("#dc-subject-other").val().split("\n");
	if(subjects.indexOf(subject) === -1) {
		subjects.push(subject);
		console.log(subject);
		$("#dc-subject-other").val(subjects.sort().join("\n"));
	}
}

function removeSubject(subject) {
	var subjects = $("#dc-subject-other").val().split("\n");
	if(subjects.indexOf(subject) !== -1) {
		subjects.splice(subjects.indexOf(subject), 1);
		$("#dc-subject-other").val(subjects.sort().join("\n"));
	}
}
