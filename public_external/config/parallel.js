



var config = {

	// GLAMpipe address and collection
	gp_url: g_apipath,
	collection: "p71_jyxadmin-tutka-data_c0_data",

	filters: [
		{
			title:"Julkaisuvuosi",
			description: "",
			render: "checkbox",
			mode: "static",
			key: "year",
			op: "or",
			display: ".sidebar-right .filters",
			values: [
				{
					value:"2017", title:"2017", checked: false
				},
				{
					value:"2016", title:"2016", checked: true
				},
				{
					value:"2015", title:"2015", checked: false
				}
			]
		},
		
		{
			title:"JUFO luokat",
			description: "",
			render: "checkbox",
			mode: "static",
			key: "jufoclass",
			op: "or",
			display: ".sidebar-right .filters",
			values: [
				{
					value:"0", title:"taso 0", checked: true
				},
				{
					value:"1", title:"taso 1", checked: true
				},
				{
					value:"2", title:"taso 2", checked: true
				},
				{
					value:"3", title:"taso 3", checked: true
				},
				{
					value:"", title:"ei arvoa", checked: true
				}
			]
		}
	],
	
	dataRender: function(gp) {
		console.log(gp.getFilteredQuery());
		var filters = gp.getFilteredQuery();
		var non_free = gp.get_facet_url +"getrecordorganizationnames__replaced__splitted/?has_url=no&limit=200&" + filters + "&op=or";
		var all = gp.get_facet_url +"getrecordorganizationnames__replaced__splitted/?limit=200&" + filters + "&op=or";
		//console.log(non_free);
		var final = [];
		// get all article counts
		$.getJSON(all, function(result_all) {
			// get non-free article counts (i.e. where "open_access_homepage" is empty string)
			$.getJSON(non_free, function(result_non_free) {
				// make sure that there are values for all departments
				for(var i=0; i < result_all.count.length; i++) {
					var p = result_all.count[i];
					var is_there = false;
					for(var j=0; j < result_non_free.count.length; j++) {
						var nf = result_non_free.count[j];
						if(p._id === nf._id)
							is_there = true;
					}
					// add non-free count 0 if there is are no records for that department
					if(!is_there)
						result_non_free.count.push({_id: p._id, count:0}); // number of un-free is zero if there is no result for items with empty "open_access_homepage"
				}
				//console.log(result_non_free.count);
				// calculate percentages
				final = calc_percentage(result_all, result_non_free);
				
				// sort
				final.sort(function(a, b) { return a.percentage - b.percentage });
				final.reverse();
				

				// render
				renderPercentages(final);

			})
		})
		 
	}
}


function renderPercentages (final) {
			html = "<table>";
			html += "<tr><th>laitos</th>";
			html += "<th>julkaisut</th>";
			html += "<th>rinnakkaistallennetut</th>";
			html += "<th>prosentti</th>";
			html += "</tr>"
			final.forEach(function(dep) {
				if(dep._id.search("laitos") !== -1 || dep._id == "Kauppakorkeakoulu" || dep._id == "Agora Center" || dep._id == "Soveltavan kielentutkimuksen keskus") {
					html += "<tr>";
					html += "  <td>" + dep._id + "</td>";
					html +=  "  <td>" +dep.count + "</td>";
					html +=  "  <td>" + dep.free_count + "</td>";
					if(dep.percentage >= 60)
						html += "  <td><span class='good'>" +dep.percentage+ "</span></td>";
					else
						html += "  <td><span class='bad'>" +dep.percentage+ "</span></td>";
					
					html += "</tr>"
				}
			})
			html += "</table>";
			$("#items").empty().append(html);
}

function calc_percentage(result_all, result_non_free) {
	
	var final = result_all.count.map(function(obj) { 
	   var rObj = {};
	   rObj.count = obj.count;
	   result_non_free.count.forEach(function(perc) {
		   if(obj._id == perc._id) {
				obj.non_free = perc.count;
				obj.free_count = parseInt(obj.count) - parseInt(perc.count);
				if(obj.free_count === 0 || typeof obj.free_count === "undefined")
					obj.percentage = 0;
				else
					obj.percentage = Math.round(parseInt(perc.count)/parseInt(obj.count)*(-100)+100);
			}
	   })
	   return obj;
	});
	return final;
}
