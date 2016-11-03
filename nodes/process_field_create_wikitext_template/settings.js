
var wikiFields = 
[ 
    [
        'photographer',
        'title',
        'desription',
        'depicted people',
        'depicted_place',
        'date',
        'medium',
        'dimensions',
        'institution',
        'department',
        'references',
        'object history',
        'exhibition history',
        'credit line',
        'inscriptions',
        'notes',
        'accession number',
        'source',
        'permission',
        'other versions'
    ],
    [
        'title',
        'description',
        'legend',
        'author',
        'imgen',
        'date',
        'source',
        'permission',
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
        'institution',
        'accessionnumber',
        'dimensions',
        'medium',
        'inscriptions',
        'notes',
        'other versions'
    ]
]; 
			
var sel = node.params.template;
for(var i = 0; i < wikiFields[sel].length; i++) { 
   var label = '<label>' + wikiFields[sel][i] + '</label>';  
   var input1 = '<input name=\"_wt_1_' + wikiFields[sel][i] + '\" class=\"node-settings short_input\" /><span > + </span>'; 
   var input2 = '<input name=\"_wt_2_' + wikiFields[sel][i] + '\" class=\"node-settings dynamic_field middle_input\" /> <span > + </span>'; 
   var input3 = '<input name=\"_wt_3_' + wikiFields[sel][i] + '\" class=\"node-settings short_input\" /><span > + </span>'; 
   var input4 = '<input name=\"_wt_4_' + wikiFields[sel][i] + '\" class=\"node-settings dynamic_field middle_input\" /><span > + </span>'; 
   var input5 = '<input name=\"_wt_5_' + wikiFields[sel][i] + '\" class=\"node-settings short_input\" /><span > + </span>'; 
   var input6 = '<input name=\"_wt_6_' + wikiFields[sel][i] + '\" class=\"node-settings dynamic_field middle_input\" /><span > + </span>'; 
   var input7 = '<input name=\"_wt_7_' + wikiFields[sel][i] + '\" class=\"node-settings short_input\" />'; 
    if(node.settings) {
        $('.template_map').append( label +'<input name=\"_wt_' + wikiFields[sel][i]+'\" class=\"dynamic_field\" value=\"'+node.settings['_wt_'+wikiFields[sel][i]]+'\"/>'); 
    } else {
        $('#node_set___node_id__').append( label + input1 + input2 + input3 + input4 + input5 + input6 + input7); 
    }
}
