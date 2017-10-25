var url = g_apipath + "/collections/"+node.collection+"/docs?skip=0&limit=1";

function update_conf() {
   var settings={};
   $(".wikidata_export_conf").each(function(group_i,group_e) {
      var columns=['item', 'property', 'qualifier', 'source'];
      for (var i in columns) 
      {
         var columnname=columns[i];
         $(this).find("."+columnname+"_settings").find(".target_"+columnname+"_row").each(function (property_i, property_e) {
            if (!(group_i in settings)) 
            {
               settings[group_i]={};
            }
            var property_id=$(this).find("input.target_property_id").val();
            var property_value=$(this).find("select.target_property_value").val();

            if (property_id!=="" && property_value!=="")
            {
               if (settings[group_i][columnname] == null) settings[group_i][columnname]={};
               settings[group_i][columnname][property_id]=property_value;
            }
        });
      }
   });
   $("#wikidata_export_settings").val(JSON.stringify(settings));
}


$.getJSON(url, function(data){
   var rec = data.data[0];
   var table = $('<table class="wikidata_export_conf" style="margin-left:5em;"><th>Item</th><th>Property</th><th>Qualifier</th><th>Source</th><</table>');
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

   if (wd_conf[0]==null)
   {
      wd_conf=[ { 'item':{'':''}, 'property': { '' : '' } } ];
   }
   else if (wd_conf[0]["property"]==null)
   {
      wd_conf[0]["property"]={ '' : '' };
   }

   for(var wd_conf_key in wd_conf){
      wd_conf_row=wd_conf[wd_conf_key];

      var tr=$("<tr>");
      var columns=['item', 'property', 'qualifier', 'source'];

      for (var i in columns) 
      {
         var columnname=columns[i];

         var td=$("<td>");
         td.addClass(columnname + "_settings");
         td.css('vertical-align', 'top');

	 var sub_table=$("<table>");
         var sub_tr;
         var sub_td;
         if (wd_conf_row[columnname])
         {
            for (var target_property_id in wd_conf_row[columnname]) {

               var target_property_val=wd_conf_row[columnname][target_property_id];
               if (target_property_val == null) target_property_val="";

               sub_tr=$("<tr>");
               sub_tr.addClass("target_" + columnname + "_row");
               sub_td=$("<td>");

               var input=$("<input>");
               input.addClass('wikidata_export_conf target_property target_property_id');
               input.val(target_property_id);
               input.change(update_conf);
               sub_td.append(input);
               if (columnname=="item")
               {
                  input.val("item");
                  sub_td.hide();
               }
               sub_tr.append(sub_td);

               sub_td=$("<td>");
               select=$("<select>" + select_values + "</select>");  
               select.addClass("wikidata_export_conf target_property target_property_value");
               select.val(target_property_val);
               select.change(update_conf);
               sub_td.append(select);
               sub_tr.append(sub_td);

               if (columnname=="qualifier" || columnname=="source" )
               {
                  sub_td=$("<td>");
                  var button=$("<button>Del</button>");
                  button.addClass("button");
                  button.css('width', '100%');
                  button.click(function() {
                     $(this).closest("tr").remove();
                     update_conf();
                  });
                  sub_td.append(button);
                  sub_tr.append(sub_td);
               }
               sub_table.append(sub_tr);
            }
         }
         if (columnname=="qualifier" || columnname=="source")
         {
            sub_tr=$("<tr>");
            sub_td=$("<td>");
            sub_td.attr("colspan", 2);
            sub_tr.append(sub_td);

            sub_td=$("<td>");
            var button=$("<button>Add</button>");
            button.addClass("add_" + columnname );
            button.addClass("button");
            button.css('width', '100%');



// Creates a new row in the property/qualifier/source table
            button.click(function() {
               var colummname="";

               if ($(this).hasClass("add_qualifier")) {
                  columnname="qualifier";
               }
               else if ($(this).hasClass("add_source")) {
                  columnname="source";
               }
               else
               {
                  return;
               }

               var sub_tr=$("<tr>");
               sub_tr.addClass("target_" + columnname + "_row");
               var sub_td=$("<td>");

               var input=$("<input>");
               input.addClass('wikidata_export_conf target_property target_property_id');
               input.val(columnname);
               input.change(update_conf);
               sub_td.append(input);
               sub_tr.append(sub_td);

               sub_td=$("<td>");
               select=$("<select>" + select_values + "</select>");  
               select.addClass("wikidata_export_conf target_property target_property_value");
               select.change(update_conf);

               sub_td.append(select);
               sub_tr.append(sub_td);

               if (columnname!=="property")
               {
                  sub_td=$("<td>");
                  var button=$("<button>Del</button>");
                  button.addClass("button");
                  button.css('width', '100%');

                  button.click(function() {
                     $(this).closest("tr").remove();
                     update_conf();
                  });
                  sub_td.append(button);
                  sub_tr.append(sub_td);
               }

               $(this).closest("tr").before(sub_tr);
               update_conf();
            });

            sub_td.append(button);
            sub_tr.append(sub_td);
            sub_table.append(sub_tr);
         }
         td.append(sub_table);
         tr.append(td);
      }

      table.append(tr);
      break;
   }

   $("#export_data_wikidata_mappings").empty().append(table);
});
