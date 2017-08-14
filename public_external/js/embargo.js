function embargoAdmin (gp_url, collection) {
	
	var self = this;
	this.collection = collection;
	this.url = gp_url;
	this.collection_url = this.url + "/api/v1/collections/" + this.collection;
	this.edit_url = this.url + "/api/v1/collections/" + this.collection + "/docs/";
	this.update_url1 = this.url + "/api/v1/nodes/58eca611159f940037c1e354/run";
	this.update_url2 = this.url + "/api/v1/nodes/58eca649159f940037c1e37f/run";
	this.get_docs_url = this.url + "/api/v1/collections/" + this.collection + "/docs?skip=0&reverse=1&sort=dt";
	this.current_request = null;


	this.init = function () {

		// "päivit lista" button click handler
		$(document).on("click", "button.update-list", function(e) {
			var doc = $(e.target).attr("id");
			self.current_request = doc;
			$("button.update-list").text("haetaan tietoja...")
			
			var options1 = {
				separator: ",",
				encoding: "utf8",
				mode: "update",
				update_key: "dt",
				username:"libcsvhaku",
				password: "haenvaindatatPlonesta"
			}

			// some trash (previous tests) that must be removed
			var options2 = {
				select: "minurmin@jyu.fi;ari.hayrinen@jyu.fi;embargon@pyytaja.com"
			}
			
			// we must run 2 nodes
			$.post(self.update_url1, options1, function (response) {
				if(response.error)
					alert(response.error);
				else {
					$.post(self.update_url2, options2, function (response) {
						if(response.error)
							alert(response.error);
						else {
							$("button.update-list").text("Päivitä lista");
							console.log(response);
							self.getItems();
						}
					})
				}
			})
		})
		
		// show request button click handler
		$(document).on("click", "button.open_request", function(e) {
			var doc = $(e.target).attr("id");
			self.current_request = doc;
			$("button.update-list").hide();
			// history
			//var stateObj = { foo: "bar" };
			//history.pushState(stateObj, "page 2", doc);
			
			$.getJSON(self.collection_url + "/docs/" + doc, function (response) {
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
		

		// checbox click handler
		$(document).on("change", "input[type='checkbox'].request_sent", function(e) {
			$(".saved").remove(); // clear "saved" notifications
			var params = {};
			params.doc_id = self.current_request;
			params.field = $(e.target).attr("id");
			params.value = $(e.target).prop( "checked" );
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



	
	this.yesno_fields = [
		{
			name:"processed", 
			title: "",
			help: "Embargo on hidaste.</br>",
			req: function(data) {
					var email_temp_en = "Dear Respondent, \nthere is a copy request regarding Your article \"" +data["item-title"] + "\"";
					var email_temp_fi = "Hei, \nartikkelistasi \"" +data["item-title"] + "\" on pyydetty kopiota.";
					var html = "";
					if (data['processed_request_sent'] && data['processed_request_sent'] === "true")
						html += "<img class='kasitelty' src='images/kasitelty.svg'/>";
					html += "<table>"
					html += "  <tr>"
					html += "    <td class='strong'>artikkelin nimi</td>"
					html += "    <td>"+data["item-title"]+"</td>"
					html += "  </tr>"
					html += "  <tr>"
					html += "    <td class='strong'>JYX-linkki</td>"
					html += "    <td><a href='" + data["item-id"] + "' target='_blank'>JYX</a></td>"
					html += "  </tr>"
					html += "  <tr>"
					html += "    <td class='strong'>sähköposti</td>"
					html += "    <td>"+data["email"]+"</td>"
					html += "  </tr>"
					html += "  <tr>"
					html += "    <td class='strong'>lisätietoja</td>"
					html += "    <td>"+ data["info"] + "</td>"
					html += "  </tr>"
					html += "  <tr>"
					html += "    <td class='strong'>artikkelin kirjoittajat</td>"
					html += "    <td>TÄHÄN haetaan rajapinnan kautta tiedot JYX 2.0:sta</td>"
					html += "  </tr>"
					html += "</table>"
					html += "<div class='strong'>viestirunko sähköpostiin:</div>"
					html += "<textarea rows='15'>";
					html +=   email_temp_fi + "\n\n";
					html +=   "alkuperäinen pyyntö ("+data["email"]+"):\n";
					html +=   data["info"]  + "\n\n";
					html +=   email_temp_en  + "\n\n";
					html +=   "original request from ("+data["email"]+"):\n";
					html +=   data["info"]  + "\n\n";
					html += "</textarea>";
					return html;
				}
		}
	
	];


	// display request help
	this.renderRequestInfo = function (field, data) {
		var result = "";

			result += "<div  class='box'>";
			result += "<h4>"+field.title+"</h4>";
			if(field.help)
				result += "<div class='help'>" +field.help+ "</div>";
			
			if(field.req)
				result += field.req(data);
				
			result += self.renderLibInfo(field, data);
			result += "</div>";	
		
		return result;		
	}


	this.renderLibInfo = function (field, data) {
		var checked = "";
		if (data['processed_request_sent'] && data['processed_request_sent'] === "true")
			checked = "checked='checked'";
		if(!data[field.name+'_libinfo'])
			data[field.name+'_libinfo'] = "";
		
		var result = "<h4>Kirjaston lisätietoja</h4>"
		result += "<label>Tiedostot lähetetty </label><input class='request_sent' "+checked+ "type='checkbox' id='"+field.name+"_request_sent'/><br/>";
		result += "  <label>lisätietoja:</label><textarea id='" + field.name + "_libinfo'>"+data[field.name+'_libinfo']+"</textarea>";
		result += "  <button class='save_libinfo' id='"+field.name+"' data-docid='"+data._id+"'>tallenna lisätiedot</button>";		
		return result;
	}


	this.renderCounts= function (data, processed) {
		var total = data.length;
		
		$("#total-count").empty().append( "(" + total +")" );
		this.yesno_fields.forEach(function(field) {
			var total_yes = Math.floor(( processed / total) * 100);

			 // percentage bar
			 html = '<div class="progress">';
			 html += '  <div class="progress-bar" role="progressbar" aria-valuenow="'+total_yes+'"';
			 html += '  aria-valuemin="0" aria-valuemax="100" style="width:'+total_yes+'%">';
			 html += '      '+ total_yes + '%'; 
			 html += '   </div>';
			 html += '</div>';
			 
			 $("#total-count").append("<h4>käsitelty:</h4>");
			 $("#total-count").append(html);

		})
	}


	this.getItems = function (leaf) {

		// init counters
		this.yesno_fields.forEach(function(field) {
			field.count_all = 0;
			field.count_yes = 0;
		})
		
		var processed_count = 0; 
		
		// get latest update date
		var node_log = "http://localhost:3000/api/v1/nodes/5890682a41c28844bf4b72ee/log";
		var last = {timestamp:""}
		$.getJSON(node_log, function (response) {
			if(Array.isArray(response)) {
				response.forEach(function(row) {
					if(row.mode === "finish")
						last = row;
				});
			}
			last.timestamp = last.timestamp.replace(/-.[0-9].$/,"") // remove last part of timestamp (confuses Date)
			var date = new Date(last.timestamp);
			var date_str = date.getDate() + "." + (date.getMonth()+1) + "." + date.getFullYear();
			date_str += " kello " + date.getHours() + ":" + date.getMinutes();
			$("#latest-update").text(date_str)
			
		})



		// get items and render	
		$.getJSON(self.get_docs_url + "&limit=100", function (response) {
			if(response.error)
				alert(response.error);
			else {
				var items = "<table width='100%'>";
				items += "<tr>";
				items += "  <th>pvm</th>";
				items += "  <th>pyytäjän email</th>";
				items += "  <th>artikkelin nimi</th>";
				items += "  <th>info</th>";
				items += "  <th>tila</th>";
				items += "  <th>avaa</th>";
				items += "</tr>";
				
				// loop through response and render table
				response.data.forEach(function(record) {
					items += "<tr>";
					items += "  <td>" + getDate(record.dt) + "</td>";
					items += "  <td>" + record.email + "</td>";
					items += "  <td><div class='strong'><a href='" + record["item-id"] + "' target='_blank'>" + record["item-title"] + "</a></div><div>"+record.info+"</div></td>";
					if(record.processed_libinfo )
						items += "  <td class='info'>" + record.processed_libinfo + "</td>";
					else
						items += "  <td></td>";
					
					
					if(record["processed_request_sent"] && record["processed_request_sent"] === "true") {
						items += "  <td><div class='yes_sent'><span class='glyphicon glyphicon-ok-circle'></span> käsitelty</div></td>";
						items += "  <td><button class='open_request' id="+record._id+">katso</button></td>";
						processed_count++;
					} else {
						items += "  <td><div class='no'><span class='bad'></span> käsittelemättä</div></td>";
						items += "  <td><button class='open_request' id="+record._id+">avaa</button></td>";
					}

					
					
					items += "</tr>";

				})
				
				items += "</table>";
				
				self.renderCounts(response.data, processed_count);
				
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
		
		$(".portletHeader").text(data["item-title"]);
		
		var str = "<div>";

		self.yesno_fields.forEach(function(field) {
			str += self.renderRequestInfo(field, data);
		})
		
		str += "</ul></div>"
		
		$("#items").empty();
		$("#items").append(str);
	}
}

function getDate (str) {
	var date_str = str.split(" ")[0];
	return date_str.split("/").join(".");
}



$( document ).ready(function() {

	// GLAMpipe address
	var collection = "p5_jyxadmin-embargo-test1_c1_requests";
	//var collection = "p15_admin-embargopyynnt_c0_requests";
	var gp_url = "http://siljo.lib.jyu.fi:8080/gp";
	//var gp_url = "http://localhost:3000";
	var admin = new embargoAdmin(gp_url, collection);
	admin.init();
	admin.getItems();
	//$("button.update-list").show();

	// quick hack so that we can go back with back button
	//window.addEventListener("popstate", function(e) {   
		//location.reload();
	//});
	
});
