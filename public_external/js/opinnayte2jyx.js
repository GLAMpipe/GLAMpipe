

// GLAMpipe-osoite
var gpurl = "http://localhost:3000" // local dev
//var gpurl = "http://siljo.lib.jyu.fi:8080/gp"
var apiurl = gpurl + "/api/v1";
globals.collection = "p1_opinnytelomake_c0_y collection";

// node titles and ids for running project nodes
var nodes = {
	"filetype":{"id":"598ad58f4eed1164307c0331","node":{"title":"file_type"}},
	"pdf2image":{"id":"598169354905457ddbd3bbc3","node":{"title":"pdf2image"}},
	"pdf2text":{"id":"59816b574905457ddbd3bbca","node":{"title":"pdf2text"}},
	"detectlanguage":{"id":"598c2f115f5b982dfe2453be","node":{"title":"detect_language"}, "settings":{"mode":"percentage", "percentage":"51"}},
	"annif":{"id":"	598ad6324eed1164307c0333","node":{"title":"ANNIF"}}
}

globals.nodes = nodes;

// GLAMpipe-login
var login = {
	email: "opinnayte",
	password: "opinnayte_JYU"
}

// kuinka monta asiasanaa haetaan
var maxhits = 20;

var dspaceurl = null;
var dspaceurl = "http://siljo.lib.jyu.fi:8080";



$( document ).ready(function() {

	$(".metatiedot-header").hide();
	//$("#jyx-data").hide();
	$(".talletus-header").hide();
	$("#ready-to-save").hide();
	$("#contract").hide();
	//$("#info-container").hide();

	
	
    $( "#oppiaine" ).autocomplete({
      source: oppiaineet,
      select: function( event, ui ) {
        $( "#oppiaineet" ).append(ui.item.label);
 
        return false;
      }
    });

	var items = [];
	globals.errors = [];


	function failFunction(status) {
		alert(status);
		$("#upload-status").empty();
		
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
			var project_title = "OPIN2JYX_" + date.toISOString();
			var formData = getFormData();

			if(!formData.get("file").name || formData.get("file").name == "") {
				alert("Valitse tiedosto!");
			} else {
				globals.original_filename = formData.get("file").name;
				// upload file first
				file2GP().then(function(data) {
					$("#items").empty();
					$("#lataus").hide();
					$("#pdf-guide").hide();
					$(".lataus-header").hide();
					$(".metatiedot-header").show();
					$("#metatiedot").show();
					$("#upload-status").empty();
					$("#upload-status").append("<div class='alert alert-info'>Tiedosto " + formData.get("file").name + " talletettu!</div>");
				// then get keywords
					return getAnnifKeywords(globals.doc_id);
				}).then(function(data) {
					$("#upload-status").empty().append("<div class='alert alert-info'>Tiedosto " + formData.get("file").name + " talletettu!</div>");
					$("#upload-status").append("<div class='alert alert-info'>Automaattinen asiasanoitus tehty!</div>");
					renderYSOt(data);
				})
				.catch(failFunction);
			}


		}).catch(function(status){alert("Jostain syystä en voinut kirjautua palveluun!")})


	})

	$("#put2glampipe").click(function() {

		if(!globals.doc_id) {
			alert("Lataa tiedosto, anna metatiedot ja sitten talleta.")
		} else {
			var data = getJYXDataDoc();
			updateDocumentGP(data).then(function(data) {
				//console.log("onnistui")
				$(".metatiedot-header").hide();
				$("#metatiedot").hide();
				$("#ready-to-save").hide();
				$("#save-status").empty().append("<div class='alert alert-info'>Tiedot lähetetty!</div>");
			})
			.catch(fail);
		}
	})


	$(document).on("click", ".ysot div", function(e) {
		if($(this).hasClass("selected"))
			$(this).removeClass("selected");
		else
			$(this).addClass("selected");
		
	})

	$("#contractresearch").change(function() {
		$("#contract").toggle();
	})


	$("#read-form").click(function() {
var data = getJYXDataDoc();
		console.log(data);
	})

	$("#dc-type").change(function() {
		$("#jyx-data").show();
		$("#talletus-container").show();
		$("#ready-to-save").show();
	})

	$("#get_organisations").click(function() {
		
		console.log(tiedekunnat);
		var html = "";
		for(var i=0; i < tiedekunnat.length; i++) {
			var data = getOrganisationData(tiedekunnat[i]);
			html += "<li>" + data.names["urn:language:fin"] + "</li>";
		}
		$("#tiedekunta").append(html);
/*
		var params = {
			date:"2017-01-01",
			urn:"urn:organisation:jyu"
		}

		var d = {
			url: "https://api.cc.jyu.fi/call/organisation.get_suborganisations",
			data: params,
			type: "POST",
			dataType: "json"
		}
		post(d).then(function(data) {
			if(data.error) throw("Kirjautuminen ei onnistunut!");
			console.log(data);


		}).catch(function(status){alert("En saanut organaatiodataa!")})

*/
	})

});


function getOrganisationData(urn) {
	for(i=0; i < g_organisations.result.length; i++) {
		if(g_organisations.result[i].urn == urn)
			return g_organisations.result[i].data[0];
	}
}


function preview() {
	$("#preview-data div").each(function(index) {
		var id = $(this).attr("id").replace("preview-", "");
		switch(id) {
			case "dc-type":
				$("#preview-" + id).empty().append($("#"+id).val());
			break;
			
			default:
				$("#preview-" + id).empty().append($("#"+id).val());
		}
	})
}

/*
(function update() {
	var params = {
		date:"2017-01-01",
		urn:"urn:organisation:jyu"
	}
	var d = {
		url: "http://localhost:3000/api/v1/projects",
		type: "GET",
		dataType: "json"
	}
    $.ajax(d).then(function() {           // on completion, restart
       setTimeout(update, 3000);  // function refers to itself
    });
})();
*/
