
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
for(var i = 0; i < wikiFields[sel].length; i++) { 
   var label = '<label>' + wikiFields[sel][i] + '</label>';  
   var input1 = '<input name=\"_wt_1_' + wikiFields[sel][i] + '\" class=\"node-settings middle_input\" /><span > + </span>'; 
   var input2 = '<input name=\"_wt_2_' + wikiFields[sel][i] + '\" class=\"node-settings dynamic_field middle_input\" /> <span > + </span>'; 
   var input3 = '<input name=\"_wt_3_' + wikiFields[sel][i] + '\" class=\"node-settings short_input\" /><span > + </span>'; 
   var input4 = '<input name=\"_wt_4_' + wikiFields[sel][i] + '\" class=\"node-settings dynamic_field short_input\" /><span > + </span>'; 
   var input5 = '<input name=\"_wt_5_' + wikiFields[sel][i] + '\" class=\"node-settings short_input\" /><span > + </span>'; 

   
   $('#node_set___node_id__').append( label + input1 + input2 + input3 + input4 + input5); 
}
