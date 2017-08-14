

// GLAMpipe-osoite
//var gpurl = "http://localhost:3000" // local dev
var gpurl = "http://siljo.lib.jyu.fi:8080/gp"
var apiurl = gpurl + "/api/v1";

// GLAMpipe-login
var login = {
	email: "file2jyx",
	password: "file2jyx_JYU"
}

// kuinka monta asiasanaa haetaan
var maxhits = 20;

// FINNA
var finnaurl = "https://api.finna.fi/api/v1";
var options = "&type=AllFields&sort=relevance&page=1&limit=20&prettyPrint=true&lng=fi&filter[]=building:0/JYU/"

var dspaceurl = null;
//var dspaceurl = "https://jyx-beta.jyu.fi/rest";


//var record = {
	//"metadata": [{
		//"key": "dc.contributor.author",
		//"value": "Pekkala, Nina",
		//"language": ""
	//}, {
		//"key": "dc.contributor.author",
		//"value": "Knott, Emily",
		//"language": ""
	//}, {
		//"key": "dc.title",
		//"value": "The effect of inbreeding rate on fitness, inbreeding depression and heterosis over a range of inbreeding coefficients",
		//"language": "en"
	//}
	//]
//}

$( document ).ready(function() {

	$(".metatiedot").hide();
	$(".tallentaminen").hide();
	$(".login-div").hide();
	$("#ready-to-save").hide();
	$("#jyx-data").hide();
	
	var items = [];
	globals.errors = [];


	function failFunction(status) {
		$("#items").append("<div>" + status + "</div>");
		
	}

	// lataa tiedosto GLAMpipeen
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
			var project_title = "FILE2JYX_" + date.toISOString();
			var formData = getFormData();

			if(!formData.get("file").name || formData.get("file").name == "") {
				alert("Valitse tiedosto!");
			} else {
				createFile2JyxProject(project_title).then(function(data) {
					$("#items").empty();
					$(".upload").hide();
					$(".metatiedot").show();
					//$("#items").append("<div>Projekti valmis!</div><a target='_blank' href='"+gpurl+"/project/" + project + "'><button>avaa</button>");
					renderTable(data);
					renderPDFinfo(data);
					$(".metatiedot").show();
				})
				.catch(failFunction);
			}


		}).catch(function(status){alert("Jostain syystä en voinut kirjautua palveluun!")})


	})

	$(".fetch_finna").click(function() {
		var type = $(this).attr("id");
		var url = finnaurl + "/search?lookfor=" + type + ":";   // :
		var isbn_or_id = $("#search").val();
		$("#items").empty();
		$("#jyx-input").addClass("hidden");
		
		$.getJSON(url + isbn_or_id + options, function(result) {
			console.log(result);
			if(result.resultCount) {
				items = result.records;
				$("#fetch-info").html("Löytyi " + result.resultCount + " opusta tms.");
				JYXwarning(result.records);
				renderFinnaTable(result.records);
			} else {
				$("#fetch-info").html("Ei löytynyt mitään!");
				$("#jyx-info").empty();
			}

		})
	})
	

	$(".fetch_finna_id").click(function() {
		var type = $(this).attr("id");
		var id = $("#search").val().trim();
		var url = finnaurl + "/record?id=" + id;   
		$("#items").empty();
		$("#jyx-input").addClass("hidden");
		
		$.getJSON(url + options, function(result) {
			console.log(result);
			if(result.resultCount) {
				items = result.records;
				$("#fetch-info").html("Löytyi " + result.resultCount + " opusta tms.");
				JYXwarning(result.records);
				renderFinnaTable(result.records);
			} else {
				$("#fetch-info").html("Ei löytynyt mitään!");
				$("#jyx-info").empty();
			}

		})
	})

	// click handler for "open" buttons
	$(document).on("click", "button.open", function(e) {
		$("#finna").empty();
		$("#jyx-info").empty();
		var id = $(this).attr("id");
		items.forEach(function(item) {
			if(item.id == id)
				fetchRecord(item);
		})
		
	})	

	// manuaalinen tietojensyöttö
	$("#manual").click(function(e) {
		e.preventDefault();
		$("#jyx-data").show();
		$(".tallentaminen").show();
	})


	$("#login2jyx").click(function() {

		var url = dspaceurl + "/login";
		var login = {};
		login.email = $("#username").val();
		login.password = $("#password").val();
		
		
		$.ajax({
			type: "POST",
			url: dspaceurl + "/rest/login",
			data: login,
			xhrFields: {
				withCredentials: true
			},
			headers: {
					'Accept': 'application/json',
			},
			crossDomain: true,
			success: success,
			error: error
		});

		function error (XMLHttpRequest, textStatus, errorThrown) {
			alert("Kirjautuminen ei onnistunut!");
		}

		function success(result) {
			$.getJSON(dspaceurl + "/rest/status", function(result) {
				if(result.authenticated) {
					$("#ready-to-save").show();
					$(".login-div").append("<div class='alert alert-success'>Kirjautuminen onnistui</div>");
				} else
					alert("kirjautuminen epäonnistui");
			})
			.error(function() { alert("error"); })
		}
	
	})


	$("#put2jyx").click(function() {

		var handle = ""; 
		var collection = $("#collections").val();
		if(!collection)
			alert("Valitse kokoelma!");

		var data = getJYXData();
		$("#save-result").append("<div class='alert alert-info'>Tallennan metatietoja ...</div>");

		$.ajax({
				type: "POST",
				url: dspaceurl + "/rest/collections/" + collection + "/items",
				contentType: 'application/json',
				data: JSON.stringify(data),
				headers: {
						'Accept': 'application/json',
				},
				success: success,
				error:save_error
		});

		function save_error(XMLHttpRequest, textStatus, errorThrown) {
			$("#save-result").append("<div class='alert alert-danger'>Tallennus epäonnistui. "+errorThrown+"</div>");
		}

		function success(result) {
			handle = result.handle;
			$("#save-result").append("<div class='alert alert-success'>Tallennettu!</div>");

			var formData = getFormData();

			if(!formData.get("file").name || formData.get("file").name == "") {
					alert("Lataa ensin tiedosto, anna metatiedot ja sitten vasta klikkaa mua!");
			} 

			var url = dspaceurl + "/rest/items/" + result.uuid + "/bitstreams?name=" + formData.get("file").name;
			$("#save-result").append("<div class='alert alert-info'>Tallennan tiedostoa ...</div>");
			var formData = getFormData();
			var d = {
					url: url,
					type: "POST",
					dataType: "json",
					data:  formData,
					contentType: false,
					cache: false,
					processData:false,
					success:success2,
					error: save_error,
					headers: globals.headers
			}

			$.ajax(d);

			console.log(result);
		}

		function success2(res) {
				console.log(res);
				var link = dspaceurl + "/xmlui/handle/" + handle;
				$("#save-result").empty().append("<div class='alert alert-success'>Tallennettu! <a target='_blank' href='"+link+"'>"+link+"</a></div>");
				$("#save-result").append("<br><button id='uusi'>aloita uusi tallennus</button>")
		}

	})


	$("#testaa2jyx").click(function() {
		var data = getJYXData();
		console.log(data);
	})




	$("#dspace").change(function (e) {
			
		$("#export_data_dspace_coll_list").empty();
		$("#export_data_dspace_coll_list").append("<h3>Fetching...</h3>");
		$("#export_data_dspace_coll_list").show();
		$("#collections").empty().append("<option>haen kokoelmia...</option>");
		dspaceurl = $(this).val();

		$.getJSON(dspaceurl + "/rest/hierarchy", function (data) {
			if(data.error)
				alert(data.error);
			else {
				//$("#export_data_dspace_coll_list").append("<h2>"+data.name+"</h2>");
				$("#collections").empty().append("<option>valitse kokoelma</option>");
				$("#collections").append(displayCollections(data.community, "community", 2));
			}
		}).error(function() {
			alert("kokoelmien haku epäonnistui!")
		})				
	})


	// click handler for "open" buttons
	$("#collections").change(function(e) {
		$(".login-div").show();
	})	

	$("#annif").on("click", "li", function(item) {
		if(!$(this).hasClass("bold")) {
			addSubject($(this).text());
			$(this).addClass("bold");
		} else {
			removeSubject($(this).text());
			$(this).removeClass("bold");
		}
			
	})

	$(document).on("click", "#uusi", function() {
		location.reload();
	})


});



