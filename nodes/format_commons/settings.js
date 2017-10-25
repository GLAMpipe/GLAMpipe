
var wikiFields = 
[ 
    [
        'photographer',
        'depicted people',
        'depicted place',
        'dimensions',
        'references',
        'object history',
        'exhibition history',
        'credit line'
    ],
    [
        'legend',
        'author',
        'imgen',
        'mapdate',
        'location',
        'projection',
        'scale',
        'heading',
        'latitude',
        'longitude',
        'warped',
        'set',
        'sheet',
        'type',
        'language',
        'publisher',
        'printer',
        'printdate',
        'dimensions'
    ],
    [
        'artist',
        'author',
        'language',
        'publisher',
        'printer',
        'printdate',
        'dimensions'
    ]
]; 

// create inputs dynamically based template chosen			
var sel = node.params.template;
var table = "<table>";
for(var i = 0; i < wikiFields[sel].length; i++) { 
	table += "<tr>";
	table += "<td>" + wikiFields[sel][i] + "<td>";  
	table += "<td><input name='" + wikiFields[sel][i] + "_static' class='node-settings middle_input' /></td>"; 
	table += "<td><select name='" + wikiFields[sel][i] + "_dynamic' class='node-settings dynamic_field' ><option value=''>no value</option></select></td>"; 
	table += "</tr>";
}

table += "<table>";
$('#node_set___node_id__').append(table); 
