
var c = context; 
var templates = ['Photograph', 'Map']; 
var output = '{{' + templates[parseInt(c.node.params.template)] + '\\n'; 
var settings = context.node.settings; 
var wikifield = ''; 
            
for (key in settings) {
    if (key.indexOf('_wt_') === 0) {       
       if (key.indexOf('_wt_1') === 0 || key.indexOf('_wt_3') === 0 || key.indexOf('_wt_5') === 0 || key.indexOf('_wt_7') === 0 ) { 
           wikifield += settings[key]; 
       } else {
           wikifield += c.get(context.doc, settings[key]); 
       }
            
/* set output on last field of series */
       if (key.indexOf('_wt_7') === 0 ) { 
           var stripped = key.replace(/_wt_7_/,''); 
           output += '|' + stripped + ' = ' + wikifield + '\\n'; 
           wikifield = ''; 
       } 
    }
}

output += '}}\\n'; 

var cats = c.get(context.doc, settings.categories); 
if (cats.constructor.name === 'Array') {
    for(var i = 0; i < cats.length; i++) {
        output += '[[Category:' + cats[i] + ']]\\n'; 
    }
}

if(settings.category_all != '') 
    output += '[[Category:' + settings.category_all + ']]\\n'; 

output += '[[Category:metapipe uploads]]\\n'; 
out.value = output; 
