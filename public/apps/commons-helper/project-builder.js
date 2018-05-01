
// GLAMpipe-osoite
var gpurl = "http://localhost:3000" // local dev
//var gpurl = "http://siljo.lib.jyu.fi:8080/gp"
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
var options = "&type=AllFields&sort=relevance&page=1&limit=20&prettyPrint=true&lng=fi"

var task = {
	question: "What do you want to do?",
	options: [
		{
			id:"file_csv",
			title: "Browse my data",
			func: function () {renderQuestion(where_is_data, "#question");}
		},
		{
			id:"web_dspace",
			title: "Upload images to Wikimedia Commons",
			func: function () {renderQuestion(where_are_images_and_metadata, "#question");}
		},		
		{
			id:"web_flickr",
			title: "Upload files to Dspace",
			func: function () {renderQuestion(where_is_data, "#question");}
		},
	]
}

var where_are_images_and_metadata = {
	question: "Where are your images and metadata?",
	options: [
		{
			id:"file_csv",
			title: "Images are online and metadata is in CSV file",
			func: function () {importFromCSV();}
		},
		{
			id:"web_dspace",
			title: "Images are on my hardrive and metadata is in CSV file",
			func: function () {importFromCSV();}
		},		
		{
			id:"web_flickr",
			title: "Images and metadata are in Flickr",
			func: function () {importFromFlickr();}
		},
		{
			id:"web_flickr",
			title: "Images and metadata are in DSpace",
			func: function () {importFromDSpace();}
		},
		{
			id:"web_flickr",
			title: "Images and metadata are in FINNA",
			func: function () {importFromFINNA;}
		},
	]
}

var where_is_data = {
	question: "Where is your data?",
	options: [
		{
			id:"file_csv",
			title: "CSV file on my computer",
			func: function () {importFromCSV();}
		},
		{
			id:"web_dspace",
			title: "DSpace repository",
			func: function () {importFromDSpace();}
		},		
		{
			id:"web_flickr",
			title: "Flickr",
			func: function () {importFromFlickr();}
		},
		{
			id:"web_finna",
			title: "FINNA",
			func: function () {importFromFINNA();}
		},
	]
}



$( document ).ready(function() {
	
    var gp = new glamPipe();
    $("#csv-upload").hide();

	renderQuestion(task, "#question");
	$("#doupload").click(function() {
		var date = new Date();
		var project_title = "helper_" + date.toISOString();

		createCSVProject(project_title).then(function(data) {
			$("#csv-upload").hide();
			$("#result").append("<div>Projekti valmis!</div><a target='_blank' href='"+gpurl+"/project/" + globals.project + "'><button>avaa</button>");
		})
		.catch(failFunction);
	})

	
});

function renderQuestion(q, div) {
	
	var html = "";
	html += '<div class="fatbox">' + q.question + '</div>';
	$(div).empty().append(html);
	for(var i=0; i<q.options.length; i++) {
		let qq = q.options[i];
		var p = $("<li>" + q.options[i].title + "</li>");
		p.click(function(){qq.func()});
		$(div).append(p);
	}
	//

}

function hi(div, text) {
	
}

function importFromDSpace(service) {

	//hi();
	var html = "";
	html += '<div class="fatbox">Give the address of DSpace</div>';
	html += "<input placeholder='http://'/>" 
	$("#question").append(html);
	
}

function importFromCSV() {
	$("#csv-upload").show();
	
	// create csv node
	
	
	// try to run with differentn separators ,;| ja tab
	
	// show the sample
	
	// create rest of the project depending of task
}

function importFromFlickr() {
	
}
