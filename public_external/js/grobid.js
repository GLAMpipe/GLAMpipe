

// GLAMpipe-osoite
var gpurl = "http://localhost:3000" // local dev
//var gpurl = "http://siljo.lib.jyu.fi:8080"
var apiurl = gpurl + "/api/v1";

// GLAMpipe-login
var login = {
	email: "annif",
	password: "annif_JYU"
}

// kuinka monta asiasanaa haetaan
var maxhits = 20;



$( document ).ready(function() {


	function failFunction(status) {
		$("#items").append("<div>" + status + "</div>");
		
	}

	
	$("#fetch").click(function() {

		var d = {
			url: apiurl + "/login",
			data: login,
			type: "POST",
			dataType: "json"
		}
		//post(d).then(function(data) {
			//if(data.error) throw("Kirjautuminen ei onnistunut!");
			//console.log(data);
			//localStorage.setItem('token', data.token);
			//globals.headers =  {"Authorization": "Bearer " + data.token};
			
			
			var date = new Date();
			var project_title = "GROBID_" + date.toISOString();

			var formData = getFormData();
			var filename = formData.get("file").name;
			if(typeof filename == "undefined" || filename == "") {
				alert("Valitse tiedosto!");
			} else {
				createGROBIDProject(project_title).then(function(data) {
					$("#items").append("<div>Projekti valmis!</div><a target='_blank' href='"+gpurl+"/project/" + globals.project + "'><button>avaa</button>");
					renderTable(data);
				})
				.catch(failFunction);
			}


		//}).catch(function(status){alert("Jostain syystä en voinut kirjautua palveluun!")})


	})

});

function renderTable(data) {

	if(data.data[0].references === "[ERROR]") {
		$("#items").empty();
		$("#subjects").empty().append("<h2>GROBID-hommeli ei onnistunut!</h2>");
		return;
	}

	var html = "<h4>Lähteet (" + data.data[0].references.length + ")</h4><table>";
	html += "<tr><th>otsikko</th><th>vuosi</th><th>julkaisija</th><th>haut</th></tr>"
	var plain_subjects = [];
	var title = "";
	var items = data.data[0].references;
	for(var i = 0; i < items.length; i++) {
		html += "<tr>";
		if(items[i].gr_article != "") {
			title = items[i].gr_article;
			html += "<td>" + title;
			if(items[i].gr_journal != "")
				html += "<br><i> in " + items[i].gr_journal + "</i></td>";
			else
				html += "</td>";
		} else if(items[i].gr_monogr != "") {
			title = items[i].gr_monogr;
			html += "<td>" + title + "</td>";
			
		} else if(items[i].gr_compliation != "") {
			title = items[i].gr_compilation;
			html += "<td>" + title + "</td>";
		}

		html += "<td>" + items[i].gr_publish_year + "</td>";
		html += "<td>" + items[i].gr_publisher + "</td>";
		html += "<td>" + primoSearch(title) + "</td>";
		html += "</tr>";
	}
	
	html += "</table>";
	$("#items").empty();
	$("#subjects").empty().append(html);

	
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


function primoSearch(title) {
	var q = "https://jyu.finna.fi/Primo/Search?lookfor="+title+"&type=AllFields";
	return "<a href='"+q+"' target='_blank'>primo</a>";
	
}

