function pplomakeadmin (gp_url, collection) {
	
	var self = this;
	this.collection = collection;
	this.url = gp_url;
	this.collection_url = this.url + "/get/collection/" + this.collection;
	this.edit_url = this.url + "/edit/collection/" + this.collection;
	this.get_docs_url = this.url + "/get/collection/" + this.collection + "?skip=0&reverse=1&sort=dt";
	this.current_request = null;


	this.init = function () {
		
		// show request button click handler
		$(document).on("click", "button.open_request", function(e) {
			var doc = $(e.target).attr("id");
			self.current_request = doc;
			
			$.getJSON(self.collection_url + "/doc/" + doc, function (response) {
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
			
			$.post(self.edit_url, params, function(data) {
				if(data.error)
					alert(data.error);
			})
		})
		

		// save libinfo button click handler
		$(document).on("change", "input[type='checkbox'].request_sent", function(e) {
			var params = {};
			params.doc_id = self.current_request;
			params.field = $(e.target).attr("id");
			params.value = $(e.target).prop( "checked" );
			console.log(params);
			
			$.post(self.edit_url, params, function(data) {
				if(data.error)
					alert(data.error);
			})
		})
		
	}



	
	
	this.renderAdminPerson = function (person_str) {
		var html = "";
		person_str = person_str.replace(/'/g, '"');
		console.log("person", person_str);
		var arr = JSON.parse( person_str);
		arr.forEach(function(person) {
			var part = person.split(",");
			html += "<div>"+ person + "</div>";
		})
		console.log(arr);
		return html;
	}
	
	this.yesno_fields = [
		{
			name:"projectsite", 
			title: "Hankesivusto",
			info:"projectsite_domain", 
			info_text:"URL: ",
			help: "Projekti-sivustot tilataan Plone-sivuston tilauslomakkeen kautta: </br>"
				+ "<a href='https://www.jyu.fi/itp/lomakkeet/plone-tilaus?vastuuhenkilo=matti joku'>https://www.jyu.fi/itp/lomakkeet/plone-tilaus</a><div>"
				+ "tuki: <a href='mailto:plone-support@jyu.fi'>plone-support@jyu.fi</a></div>",
			req: function(data) {
					var html = "";
					html += "<table>"
					html += "  <tr>"
					html += "    <td class='strong'>sivuston osoite</td>"
					html += "    <td>"+data.projectsite_domain+"</td>"
					html += "  </tr>"
					html += "  <tr>"
					html += "    <td class='strong'>ylläpitäjät</td>"
					html += "    <td>"+self.renderAdminPerson(data.projectsite_admin)+"</td>"
					html += "  </tr>"
					html += "</table>"
					return html;
				}
		},
		{
			name:"wiki",
			title: "Wikityötila (Confluence)",
			help: "Wikityötila tilataan tämän lomakkeen kautta: </br>"
			+ "<a href='https://www.jyu.fi/itp/lomakkeet/wiki-tilaus'>https://www.jyu.fi/itp/lomakkeet/wiki-tilaus</a><div>tuki: "
			+ "<a href='mailto:wiki-support@jyu.fi'>wiki-support@jyu.fi</a></div>",
			req: function(data) {
					var html = "";
					html += "<table>"
					html += "  <tr>"
					html += "    <td class='strong'>sivuston osoite</td>"
					html += "    <td>"+data.projectsite_domain+"</td>"
					html += "  </tr>"
					html += "  <tr>"
					html += "    <td class='strong'>työtilan nimi</td>"
					html += "    <td>"+data.projektin_nimi+"</td>"
					html += "  </tr>"
					html += "  <tr>"
					html += "    <td class='strong'>työtilan kuvaus</td>"
					html += "    <td>"+data.projektin_nimi+" -hankkeen työtila</td>"
					html += "  </tr>"
					html += "</table>"
					return html;
				}
			
		},
		{
			name:"videoneuvottelu",
			title: "Verkkokokouspalvelu (Adobe Connect)",
			help: "Verkkokokouspalvelu tilataan tämän lomakkeen kautta: </br>"
			+ "<a href='https://www.jyu.fi/itp/lomakkeet/connect-huoneen-tilaus>https://www.jyu.fi/itp/lomakkeet/connect-huoneen-tilaus</a>"
			+ "<div>tuki: ??? </div>"
			+ "ohjeet: <a target='_blank' href='https://www.jyu.fi/itp/connect-ohjeet'>https://www.jyu.fi/itp/connect-ohjeet</a>"
		},
			
		{
			name:"gitlab",
			title: "Versionhallinta (Gitlab)",
			help: "EI OLE OLEMASSA vielä!"
		},
		
		{
			name:"verkkolevy",
			title:"S-asema",
			help:"S-asema tilataan win-lähituesta."
		},
		
		{
			name:"bigdata",
			title: "Tallennustilaa suurille aineistoille",
			help:"Suurten aineistojen verkkolevytilasta on neuvoteltava erikseen. Ota yhteyttä lähitukeen."
		},
		
		{
			name:"moniviestin",
			title: "Tutkimusmonviestin",
			help: "<div>EI OLE OLEMASSA vielä!</div>"
			+ "tilataan: <a href='mailto:video-support@jyu.fi'>video-support@jyu.fi</a><br/>"
			+ "tukijono: <a href='mailto:video-support@jyu.fi'>video-support@jyu.fi</a><br/>"
			+ "tukilomake: <a href='https://moniviestin.jyu.fi/ohjeet/ohjeet/tukipyynto-moniviestin'>https://moniviestin.jyu.fi/ohjeet/ohjeet/tukipyynto-moniviestin</a>"
		},
		
		{
			name:"tietosuoja",
			title:"Tallustilaa tietosuoja-aineistoille.",
			help: "EI TIETOA vielä!"
		},
		
		{
			name:"longterm",
			title:"Julkaiseminen ja pitkäaikaissäilytys",
			help:""
		}
	];


	this.links = [
	
	];

	this.renderYesNoCell = function (field, data) {
		var result = "";
		field.count_all++;
		
		if(data[field.name + "_yes_no"] == "yes") {
			field.count_yes++;
			
			if(data[field.name + "_request_sent"] && data[field.name + "_request_sent"] === "true") {
				result = "<div class='yes_sent'>Pyyntö tehty</div>";
			} else {
				result = "<div class='yes'>Kyllä</div>";
			}
		} else
			result = "<div class='no'>Ei tarvita</div>";
			
		//if(field.info)
			//result += "<div>" + field.info_text + data[field.info] + "</div>";
			
		return "<td>" + result + "</td>";		
	}


	// display request help
	this.renderRequestInfoYes = function (field, data) {
		var result = "";

		if(data[field.name + "_yes_no"] == "yes") {
			result += "<div  class='box'>";
			result += "<h4>"+field.title+"</h4>";
			if(field.help)
				result += "<div class='help'>" +field.help+ "</div>";
			
			if(field.req)
				result += field.req(data);
				
			result += self.renderLibInfo(field, data);

			
			result += "</div>";	
		} 
		
		return result;		
	}


	this.renderLibInfo = function (field, data) {
		var checked = "";
		if (data[field.name+'_request_sent'] && data[field.name+'_request_sent'] === "true")
			checked = "checked='checked'";
		
		var result = "<h4>Kirjaston lisätietoja</h4>"
		result += "<label>Pyyntö lähetetty </label><input class='request_sent' "+checked+ "type='checkbox' id='"+field.name+"_request_sent'/><br/>";
		result += "  <label>lisätietoja:</label><textarea id='" + field.name + "_libinfo'>"+data[field.name+'_libinfo']+"</textarea>";
		result += "  <button class='save_libinfo' id='"+field.name+"' data-docid='"+data._id+"'>tallenna lisätiedot</button>";		
		return result;
	}
	


	// display request help
	this.renderRequestInfoNo = function (field, data) {
		var result = "";

		if(data[field.name + "_yes_no"] !== "yes") 
			result = "<li class='no'>"+field.title+"</li>";
			
		return result;		
	}


	this.renderCounts= function () {
		var total = self.yesno_fields[0].count_all;
		
		$("#total-count").empty().append("<h5>Peruspalvelupakettipyyntöjä: " + total + "</h5>");
		this.yesno_fields.forEach(function(field) {
			var total_yes = Math.floor(( field.count_yes / total) * 100);
			$("#total-count").append("<div>" + field.name + ": " + field.count_yes + "</div>")

			// percentage bar
			 html = '<div class="progress">';
			 html += '  <div class="progress-bar" role="progressbar" aria-valuenow="'+total_yes+'"';
			 html += '  aria-valuemin="0" aria-valuemax="100" style="width:'+total_yes+'%">';
			 html += '      '+ total_yes + '%'; 
			 html += '   </div>';
			 html += '</div>';
			 
			 $("#total-count").append(html);

		})
	}


	this.getItems = function (leaf) {

		// init counters
		this.yesno_fields.forEach(function(field) {
			field.count_all = 0;
			field.count_yes = 0;
		})
			
		$.getJSON(self.get_docs_url, function (response) {
			if(response.error)
				alert(response.error);
			else {
				var items = "<table width='100%'>";
				items += "<tr>";
				items += "  <th>pvm</th>";
				items += "  <th>projektin nimi</th>";
				items += "  <th>verkkosivut</th>";
				items += "  <th>wiki</th>";
				items += "  <th>verkkokous</th>";
				items += "  <th>gitlab</th>";
				items += "  <th>s-asema</th>";
				items += "  <th>ISOJA aineistoja</th>";
				items += "  <th>moniviestin</th>";
				items += "  <th>tietosuoja-aineistoja</th>";
				items += "  <th>pitkäaikaissäilytystä mietitty</th>";
				items += "</tr>";
				
				// loop through response and render table
				response.data.forEach(function(record) {
					items += "<tr>";
					items += "  <td>" + getDate(record.dt) + "</td>";
					items += "  <td>" + record.projektin_nimi + "</td>";
					
					self.yesno_fields.forEach(function(field) {
						items += self.renderYesNoCell(field, record);
					})
					
					items += "  <td><button class='open_request' id="+record._id+">muokkaa</button></td>";
					items += "</tr>";

				})
				
				items += "</table>";
				
				self.renderCounts();
				
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
		console.log(data);
		
		$(".portletHeader").text("PROJEKTI: " + data.projektin_nimi);
		
		var str = "<div>";
		
		//str += "<h2>Tarvittavat palvelut</h2>";
		self.yesno_fields.forEach(function(field) {
			str += self.renderRequestInfoYes(field, data);
		})

		str += "<h2>Näitä ei tarvita</h2>";
		str += "<ul>";
		self.yesno_fields.forEach(function(field) {
			str += self.renderRequestInfoNo(field, data);
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
	var collection = "p4_peruspalvelupakettilomake_c0_requests";
	var gp_url = "http://localhost:3000";
	var admin = new pplomakeadmin(gp_url, collection);
	admin.init();
	admin.getItems();
	
});
