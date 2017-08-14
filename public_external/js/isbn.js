var items = [];

$( document ).ready(function() {

var baseurl = "https://api.finna.fi/api/v1/search?lookfor=";
var options = "&type=AllFields&sort=relevance&page=1&limit=20&prettyPrint=true&lng=fi"

var button = [];

	$(".fetch").click(function() {
		var type = $(this).attr("id");
		var url = baseurl + type + ":";   // :
		var isbn_or_id = $("#search").val();
		$("#items").empty();
		$("#jyx-input").addClass("hidden");
		
		$.getJSON(url + isbn_or_id + options, function(result) {
			console.log(result);
			if(result.resultCount) {
				items = result.records;
				$("#fetch-info").html("Löytyi " + result.resultCount + " opusta tms.");
				JYXwarning(result.records);
				renderTable(result.records);
			} else {
				$("#fetch-info").html("Ei löytynyt mitään!");
				$("#jyx-info").empty();
			}

		})
	})
	

	// click handler for "open" buttons
	$(document).on("click", "button.open", function(e) {
		var id = $(this).attr("id");
		items.forEach(function(item) {
			if(item.id == id)
				renderMetadata(item);
		})
		
	})	

});

function renderTable(data) {

	var html = "<table>";
	html += "<tr><th>nimi</th><th>kirjoittaja</th><th>linkit</th><th>nappi</th></tr>"

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
		html += "<td>" + getLinks(data[i]) + "</td>";
		//var button = $()
		html += "<td><button class='open' id='"+data[i].id+"'>avaa</button></td>";
		html += "</tr>";
		
	}
	html += "</table>";
	$("#items").empty().append(html);
	
}

function renderMetadata(item) {

	// hide search result
	$("#items, #jyx-info").hide();
	$("#jyx-input").removeClass("hidden");
	
}

function get_building(item) {
	if(Array.isArray(item.buildings)) {
		
	}
}

function JYXwarning (data) {
	$("#jyx-info").empty();
	for(var i = 0; i < data.length; i++) {
		if(data[i].id.indexOf("jyx") != -1)
			$("#jyx-info").append("Tämä ISBN on jo JYXissä! Katso vaikka: " + getLinks(data[i]));
	}	
}


function getLinks(item) {
	if(Array.isArray(item.urls)) {
		var html = "";
		item.urls.forEach(function(url) {
			html += "<a href='" + url.url + "' target='_blank'>" + url.url + "</a>";
		})
		return html;
	
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

function getImage(item) {
	if(Array.isArray(item.images)) {
		return "<img src='https://finna.fi" + item.images[0] + "'/>";
	} 
	return "";
	
}
