
/*
* EXAMPLE OF VIEW SCRIPT
* - view script replaces default data table renderer
* - "node" is passed as a parameter to this script
* - "node.source.settings" includes node settings and "node.source.params" node's parameters
* - "node.data.docs" contains current (paged) set of documents
*/


// GLOBAL VARIABLES
console.log("view.js called");
var wikidata_url = "https://www.wikidata.org/wiki/";
var api_url = g_apipath + "/collections/" + node.source.collection + "/docs/";
html = "";


// HTML RENDERING

var all_commands="";
var listhtml="<table style='margin:1em'>";

for(var i = 0; i < node.data.docs.length; i++) {
    var doc = node.data.docs[i];
    var title = doc[node.source.params.in_field];
    var result = doc[node.source.params.out_result];
    var settings={};
    var wd_conf={};

    if (node.source.settings.wikidata_export_settings!=null) {

      try
      {
          wd_conf=JSON.parse(node.source.settings.wikidata_export_settings);
       } catch(e) {
          if (wd_conf_json!="") alert(wd_conf_json); // error in the above string (in this case, yes)!
          return "";
      }

    }
    var debug_str={};
    var columns=['item','property', 'qualifier', 'source'];
    var html_table="";
    var out_cols=[];

    for(var wd_conf_key in wd_conf)
    {
        var row=wd_conf[wd_conf_key];
        html_table+="<tr>";
        var col_str="";
        for (var j in columns)
        {
             var columnname=columns[j];
             if (debug_str[wd_conf_key]==null) debug_str[wd_conf_key]="";
             for (var property_id in row[columnname])
             {

                var container=$("<div>");

                var property_val=row[columnname][property_id];
                var rendered_val=doc[property_val];
		var stripped_val=container.html(rendered_val).text();
                var htmlquoted_val=stripped_val.replace(/["]/g, "&quot;");

                if (columnname=="source") property_id=property_id.replace("P", "S");
                if (columnname!="item")
                {
                   col_str+="<td>" + property_id + "</td>";
                   out_cols.push(property_id);
                }
		col_str+="<td>" + htmlquoted_val +"</td>";
                out_cols.push(stripped_val);
             }
        }
        if (out_cols.length) {
           var tmp_url="https://tools.wmflabs.org/quickstatements/#v1=" + encodeURIComponent(out_cols.join("\t"));
           html_table+="<td><a class='' target='_blank' href='"+ tmp_url+ "'>EXPORT THIS</a></td>";
           all_commands+=out_cols.join("\t") + "\n";

        }
        else
        {
           html_table+="<td></td>";
        }


        html_table+=col_str;
        html_table+="</tr>";
    }

    if(Array.isArray(result)) result = result[0];  // we assume that we have only one search term

    if (out_cols.length) {
       listhtml+=html_table;
    }
}
listhtml+="</table>";

if (all_commands!="")
{
   var tmp_url="https://tools.wmflabs.org/quickstatements/#v1=" + encodeURIComponent(all_commands);
   html+="<div style='padding:1em;'><a style='color:white !important' class='button' target='_blank' href='"+ tmp_url+ "'>EXPORT ALL TO QUICKSTATEMENTS</a></div>";
}
html+=listhtml;

// EVENT HANDLERS 

// FIXME: check if this still works?
// off() is important since view.js gets called every time user clicks node
$("datablock").off().on("click", "button", function(e) {
	e.preventDefault();
})

return html;


