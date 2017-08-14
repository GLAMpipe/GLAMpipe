

// GLAMpipe-osoite
//var gpurl = "http://localhost:3000" // local dev
var gpurl = "http://siljo.lib.jyu.fi:8080/gp"
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
		post(d).then(function(data) {
			if(data.error) throw("Kirjautuminen ei onnistunut!");
			console.log(data);
			localStorage.setItem('token', data.token);
			globals.headers =  {"Authorization": "Bearer " + data.token};
			
			
			var date = new Date();
			var project_title = "ANNIF_" + date.toISOString();

			var formData = getFormData();
			if(formData.get("file").name == "") {
				alert("Valitse tiedosto!");
			} else {
				createANNIFProject(project_title).then(function(data) {
					$("#items").append("<div>Projekti valmis!</div><a target='_blank' href='"+gpurl+"/project/" + globals.project + "'><button>avaa</button>");
					renderTable(data);
				})
				.catch(failFunction);
			}


		}).catch(function(status){alert("Jostain syystä en voinut kirjautua palveluun!")})


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


