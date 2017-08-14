function lomakeAdmin (gp_url, collection) {
	
	var self = this;
	this.collection = collection;
	this.currentDoc = null;
	this.url = gp_url;
	this.api_url = this.url + "/api/v1"
	this.edit_url = this.url + "/api/v1/collections/" + this.collection + "/docs/";
	this.get_docs_url = this.url + "/api/v1/collections/" + this.collection + "/docs?skip=0&reverse=1&sort=_id&limit=100";
	this.current_request = null;


	this.init = function () {

		
		// show request button click handler
		$(document).on("click", "button.open_request", function(e) {
			var doc = $(e.target).attr("id");
			self.current_request = doc;
			$("button.update-list").hide();
			// history
			//var stateObj = { foo: "bar" };
			//history.pushState(stateObj, "page 2", doc);
			
			$.getJSON(self.edit_url + doc, function (response) {
				if(response.error)
					alert(response.error);
				else {
					self.showItem(response.data);
				}
			})
		})
		
		// save libinfo button click handler
		$(document).on("click", "button.save_libinfo", function(e) {

			var params = {};
			params.doc_id = $(e.target).data("docid");
			params.field = $(e.target).attr("id") + "_libinfo";
			params.value = $("#"+params.field).val();
			console.log(params);
			
			$.put(self.edit_url + self.current_request, params, function(data) {
				if(data.error)
					alert(data.error);
				else
					$(e.target).after("<span class='good saved'> tallettu</span>");
			})
			.fail(function(response) {
				alert('Error: ' + response.responseText);
			});
		})
		


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
		
	}





	this.getItems = function (leaf) {

		// get items and render	
		$.getJSON(self.get_docs_url, function (response) {
			if(response.error)
				alert(response.error);
			else {
				var items = "<table width='100%'>";
				items += "<tr>";
				items += "  <th>pvm</th>";
				items += "  <th>artikkelin nimi</th>";
				items += "  <th>tyyppi</th>";
				items += "  <th>tila</th>";
				items += "  <th>avaa</th>";
				items += "</tr>";
				
				// loop through response and render table
				response.data.forEach(function(record) {
					items += "<tr>";
					items += "  <td>" + dateFromObjectId(record._id) + "</td>";
					items += "  <td>" +  record.dc_title + "</td>";
					items += "  <td>" +  record.dc_type + "</td>";
					
					if(record["dspace_link"]) {
						items += "  <td><div class='yes_sent'><span class='glyphicon glyphicon-ok-circle'></span> käsitelty</div></td>";
						items += "  <td><button class='open_request' id="+record._id+">katso</button></td>";
					} else {
						items += "  <td><div class='no'><span class='bad'></span> käsittelemättä</div></td>";
						items += "  <td><button class='open_request' id="+record._id+">avaa</button></td>";
					}

					
					
					items += "</tr>";

				})
				
				items += "</table>";
				
				//self.renderCounts(response.data, processed_count);
				
				$("#items").empty();
				$("#items").append(items);
			}
			
		}).fail(function(jqXHR) {
			if (jqXHR.status == 404) {
				alert("GLAMpipe is not responding (404)!");
			} else {
				alert("Other non-handled error type");
			}
		});
		
	}
	
	// render request and request help
	this.showItem = function (data) {

		self.currentDoc = data._id;
		var node_id = "598169354905457ddbd3bbc3"; // PDF cover image node
		$("h1").text(data.dc_title);
		renderPDFinfo(data)
		
		// publish permission
		if(data.publish_permission === "permitted")
			$("#status-info").append("<div class='alert alert-info'>Lupa julkaista OK</div>");
		else
			$("#status-info").append("<div class='alert alert-danger'>Ei lupaa julkaista!</div>");

		// check 2 authors case
		if(data.dc_contributor_author.length > 1)
			$("#status-info").append("<div class='alert alert-warning'>HUOM! Kahden tekijän teos!</div>");

		// show cover
		if(data.pdf_images) {
			var splitted = data.pdf_images.split("/");
			var file = splitted[splitted.length - 1];
			var html = "<img src='" + self.api_url + "/nodes/" + node_id + "/files/" + file + "'/>";
			$("#cover").empty().append(html);
			$("#accordion-kuva").collapse("show");
		}

		// link to file
		if(data.tmp_file && data.tmp_file !== "") {
			var file = data.tmp_file.split("/");
			file = file[file.length -1];
			$("#cover").append("<a target='_blank' href='" + self.api_url + "/upload/" + file + "'>"+data.original_file+"</a>");
		}
			
		// fill predefined html with values
		$("#jyx-data input").each(function(index) {
			var field = $(this).attr("id").replace(/-/g, "_");
			var value = data[field];
			if(Array.isArray(value))
				value = value.join(",");
				
			$(this).val(value);

		})
		
		$("#dc-language-iso").val(data.dc_language_iso);
		
		// abstracts
		$("#dc-description-abstract-en").val(data.dc_description_abstract[0]);
		$("#dc-description-abstract-fi").val(data.dc_description_abstract[1]);
		
		// keywords
		if(Array.isArray(data.dc_subject_other))
			$("#dc-subject-other").val(data.dc_subject_other.join(", "));
		if(Array.isArray(data.dc_subject_ysa))
			$("#dc-subject-ysa").val(data.dc_subject_ysa.sort().join(", "));
		
		// Dspace link
		if(data.dspace_link)
			$("#dspace-link").empty().append("<a href='"+data.dspace_link+"' target='_blank' id='dspace_link'>"+data.dspace_link+"</a>");
		
		$("#items").hide();
		$("#jyx-data").show();
		$(".info").show();
		
		if(!data["dspace_link"]) 
			$(".tallentaminen").show();
	}



}

function getDate (str) {
	var date_str = str.replace("OPIN2JYX_", "");
	var date = new Date(date_str);
	return date.toLocaleDateString();
	
}

function dateFromObjectId (objectId) {
	var date = new Date(parseInt(objectId.substring(0, 8), 16) * 1000);
	return date.getFullYear() + '-' + ('0' + (date.getMonth()+1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
	//return date.toLocaleDateString();
	//return date.toLocaleDateString().split("/").reverse().join("/");
}

function renderPDFinfo(data) {
	html = "<table>";
	html += "<tr><th>field</th><th>info</th></tr>"
	var info = data.info;
	for(field in info) {
		html += "<tr>";
		html += "<td>" + field + "</td>";
		html += "<td>" + info[field] + "</td>";
		html += "</tr>";
	}
	html += "</table>";
	
	$("#pdf-info").empty().append(html);
}




$( document ).ready(function() {

	// GLAMpipe address
	var gp_url = "http://localhost:3000";
	var collection = "p1_opinnytelomake_c0_y collection"; // localhost
	var dspaceurl = null;
	var proxy_url = gp_url + "/api/v1/proxy?url=";

	// GP login
	var login = {};
	login.email = "opinnayte";
	login.password = "opinnayte_JYU";

	dspace_item_export_node = "5982b9b577b4a223b228db8d";
	dspace_file_export_node = "598c0a39da96cf16213e6cf6";


	// settings for dspace export
	var settings = {
		"username":"",
		"password":"",
		"collection":"",
		"_mapkey_dc_title":"dc.title",
		"_mapkey_dc_contributor_author":"dc.contributor.author",
		"_mapkey_dc_contributor_advisor":"dc.contributor.advisor",
		"_mapkey_dc_language_iso":"dc.language.iso",
		"_mapkey_dc_description_pages":"dc.description.pages",
		"_mapkey_dc_date_issued":"dc.date.issued",
		"_mapkey_dc_subject_other":"dc.subject.other"
		
	}
	var itemNode = {};
	itemNode.id = dspace_item_export_node;
	itemNode.settings = settings;

	var fileNode = {};
	fileNode.id = dspace_file_export_node;
	fileNode.settings = settings;

	//var collection = "p15_admin-embargopyynnt_c0_requests";
	//var gp_url = "http://siljo.lib.jyu.fi:8080/gp";
	
	var gp = new GLAMpipe(gp_url);
	
	var admin = new lomakeAdmin(gp_url, collection);
	admin.init();
	admin.getItems();
	$("#jyx-data").hide();
	$(".tallentaminen").hide();
	$(".info").hide();

	$("#dspace").change(function (e) {
			
		$("#export_data_dspace_coll_list").empty();
		$("#export_data_dspace_coll_list").append("<h3>Fetching...</h3>");
		$("#export_data_dspace_coll_list").show();
		$("#collections").empty().append("<option>haen kokoelmia...</option>");
		dspaceurl = $(this).val();
		$.getJSON(proxy_url + encodeURIComponent(dspaceurl + "/rest/hierarchy"), function (data) {
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


	// collection choose handler
	$("#collections").change(function(e) {
		admin.currentDSpaceCollection = $(this).val();
	})

	$("#save2GP").click(function() {

		var doc = getJYXDataDoc() ;
		gp.login(login)
			.then(function(data) {
				return gp.updateDoc(collection, admin.currentDoc, doc);
			}).catch(function(status) {
				alert("Tallettaminen ei onnistunut!");
			}
		)
	})


	$("#put2jyx").click(function() {

		if(!admin.currentDSpaceCollection) {
			alert("Valitse DSpace ja kokoelma ensin!");
			return;
		}
		itemNode.settings.username = $("#username").val();
		fileNode.settings.username = $("#username").val();
		itemNode.settings.username = $("#username").val();
		itemNode.settings.password = $("#password").val();
		fileNode.settings.collection = admin.currentDSpaceCollection;
		var doc_id = admin.currentDoc;
		var doc = getJYXDataDoc() ;
		gp.login(login)
			.then(function(data) {
				// update document in GLAMpipe
				return gp.updateDoc(collection, admin.currentDoc, doc);
				
			}).then(function(data) {
				// create DSpace item
				return gp.runNodeSingle(itemNode, doc_id);
				
			}).then(function(data) {
				if(!data.result.setter)
					throw("Tämä on jo talletettu!");
					
				$("#dspace-link").empty().append("<a target='_blank' href='" + data.result.setter.dspace_link + "'>"+data.result.setter.dspace_link+"</a>");
				// upload file to DSpace item
				return gp.runNodeSingle(fileNode, doc_id);
				
			}).then(function(data) {
				if(data.error)
					alert(data.error);
				console.log(data);
				
			}).catch(function(status) {
				alert("Nyt ei onnistu! Computer says: " + status );
			}
		);
	})

	// quick hack so that we can go back with back button
	//window.addEventListener("popstate", function(e) {   
		//location.reload();
	//});
	
});
