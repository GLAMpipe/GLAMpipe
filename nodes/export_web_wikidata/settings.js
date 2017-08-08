var url = g_apipath + "/collections/"+node.collection+"/docs?skip=0&limit=1";

   $.getJSON(url, function(data){
           var rec = data.data[0];
           var table = $('<table class="wikidata_export_conf"><th>current field</th><th>target property</th><th>qualifier property</th><th>qualifier value</th><th>source property</th><<th>source value</th><</table>');
           var select_values='';
           var wd_conf={}
           var wd_conf_json=$("#wikidata_export_settings").val();
           try {
		wd_conf = JSON.parse(wd_conf_json);
	   } catch(e) {
		if (wd_conf_json!="") alert(wd_conf_json); // error in the above string (in this case, yes)!
	   }

           for(var f in rec){
		select_values+='<option value="'+f+'">' + f +'</option>';
	   }
           for(var f in rec){
	 
/*		
               var target_property=wd_conf[f]["property"] ? wd_conf[f]["property"] : '';
               var qualifier_property=wd_conf[f]["qualifier_property"] ? wd_conf[f]["qualifier_property"] : '';
               var source_property=wd_conf[f]["source_property"] ? wd_conf[f]["source_property"] ? '';
               var qualifier_source=wd_conf[f]["qualifier_property"] ? wd_conf[f]["qualifier_source"] : '';
               var source_source=wd_conf[f]["source_property"] ? wd_conf[f]["source_source"] ? '';
		*/
               var wd_conf_row={};
               if (f in wd_conf) { wd_conf_row=wd_conf[f]; }

               var tr=$("<tr>");
               var td=$("<td>");

               var div=$("<div>" + f +"</div>");
               div.addClass("target_property");
               td.append(div);
               tr.append(td);

               td=$("<td>");
               var input=$("<input>");
               var target_property_val=('property_property' in wd_conf_row) ? wd_conf_row['property_property'] : '';
               input.addClass('wikidata_export_conf target_property');
               input.attr("name", f + '_property_property');
               input.val(target_property_val);
               td.append(input);
               tr.append(td);

               td=$("<td>");  
               input=$("<input>");  
               input.addClass("wikidata_export_conf target_qualifier");
               input.attr("name",  f + '_qualifier_property');
               input.val(('qualifier_property' in wd_conf_row) ? wd_conf_row['qualifier_property'] : '');
	       if (target_property_val == "") input.prop('disabled', true);
               td.append(input);
               tr.append(td);

               td=$("<td>");  
               select=$("<select>" + select_values + "</select>");  
               select.addClass("wikidata_export_conf target_qualifier");
               select.attr("name",  f + '_qualifier_source');
               select.val(('qualifier_source' in wd_conf_row) ? wd_conf_row['qualifier_source'] : '');
	       if (wd_conf_row['target_property'] == "") select.prop("disabled", true);
               td.append(select);
               tr.append(td);


               td=$("<td>");  
               input=$("<input>");  
               input.addClass("wikidata_export_conf target_source");
               input.attr("name",  f + '_source_property');
               input.val(('source_property' in wd_conf_row) ? wd_conf_row['source_property'] : '');
	       if (wd_conf_row['target_property'] == "") input.prop("disabled", true);
               td.append(input);
               tr.append(td);


               td=$("<td>");  
               select=$("<select>" + select_values + "</select>");  
               select.addClass("wikidata_export_conf target_source");
               select.attr("name",  f + '_source_source');
               select.val(('source_source' in wd_conf_row) ? wd_conf_row['source_source'] : '');
	       if (wd_conf_row['target_property'] == "") select.prop("disabled", true);
               td.append(select);
               tr.append(td);

               table.append(tr);

           }

	   table.find(".wikidata_export_conf").on("change blur", update_property_lock);
	   table.find(".wikidata_export_conf").on("focus", function(e) {
		var row=$(this).closest("tr");
		row.find(".target_qualifier").prop("disabled", false);
		row.find(".target_source").prop("disabled", false);
           });
           $("#export_data_wikidata_mappings").empty().append(table);
   });


	function update_property_lock(e) {
		var row=$(this).closest("tr");
		target_property_val=row.find("input.target_property").val();
		if (target_property_val=="")
		{
			row.find(".target_qualifier").prop("disabled", true);
			row.find(".target_source").prop("disabled", true);
		}
		else
		{
			row.find(".target_qualifier").prop("disabled", false);
			row.find(".target_source").prop("disabled", false);
		}
		
		get_wd_conf();
	        e.preventDefault();
	   }



           function get_wd_conf()
	   {
		var ret={}
		$("table.wikidata_export_conf").find("tr").each(function(n) {
			var source=$(this).find("div.target_property").text();
			var target_property=$(this).find("input.target_property").val();
			var target_qualifier_property=$(this).find("input.target_qualifier").val();
			var target_qualifier_source=$(this).find("select.target_qualifier").val();
			var target_source_property=$(this).find("input.target_source").val();
			var target_source_source=$(this).find("select.target_source").val();
			var r={
				'property_property': target_property,
				'property_source': source,
				'qualifier_property': target_qualifier_property,
				'qualifier_source': target_qualifier_source,
				'source_property': target_source_property,
				'source_source': target_source_source
			};
                        if (source!="") ret[source]=r;
		});
		ret_json=JSON.stringify(ret);
		$("#wikidata_export_settings").val(ret_json);
	   }






