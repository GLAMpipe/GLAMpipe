
var c = context; 
var templates = ['Photograph', 'Map']; 
var output = '{{' + templates[parseInt(c.node.params.template)] + "\n"; 
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
           output += "|" + stripped + " = " + wikifield + "\n"; 
           wikifield = ""; 
       } 
    }
}

output += "}}\n"; 

// add categories from individual data fields
var cats = c.get(context.doc, settings.categories); 
if (cats.constructor.name === 'Array') {
    for(var i = 0; i < cats.length; i++) {
        output += "[[Category:" + cats[i] + "]]\n"; 
    }
}

// add categories for all images
if(settings.category_all) 
    output += "[[Category:" + settings.category_all + "]]\n"; 


// self promote
output += "[[Category:GLAMpipe uploads]]\n"; 


if(parseInt(context.count) % 100 == 0) 
    out.say('progress', context.node.type.toUpperCase() + ': processed ' + context.count + '/' + context.doc_count);

// out put wikitext
out.value = output; 

