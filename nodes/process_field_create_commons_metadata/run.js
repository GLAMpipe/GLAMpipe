
var c = context; 
var templates = ["Photograph", "Map", "Artwork"]; 
var output = '{{' + templates[parseInt(c.node.params.template)] + "\n"; 
var settings = context.node.settings; 
var wikifield = ''; 

// TITLES
output += "|title = " + makeValues("title") + "\n";
output += "|description = " + makeValues("description") + "\n";
// TITLE languages

function getValue(field) {
	var value = context.doc[field];
	if(typeof value === "undefined")
		return "";
	return value;
}


function makeValues(field) {
	var dyn1 	= settings[field + "_dyn1"];
	var static1 = settings[field + "_static1"];
	var static2 = settings[field + "_static2"];
    var values 	= [];
    
    var dyn1_value = getValue(dyn1);
    if(Array.isArray(dyn1_value)) {
        dyn1_value.forEach(function(title) {
            values.push(static1 + title + static2);
        })
    } else {
        values.push(static1 + dyn1_value + static2);
    } 
    setLangCodes(values, field);
    return values.join("\n");  
}





// DESCRIPTIONS
            
for (key in settings) {
    if (key.indexOf('_wt_') === 0) {       
       if (key.indexOf('_wt_1') === 0 || key.indexOf('_wt_3') === 0 || key.indexOf('_wt_5') === 0 ) { 
           wikifield += settings[key]; 
       } else {
           wikifield += c.get(context.doc, settings[key]); 
       }
            
/* set output on last field of series */
       if (key.indexOf('_wt_5') === 0 ) { 
           var stripped = key.replace(/_wt_5_/,''); 
           if(wikifield !== "")
                output += "|" + stripped + " = " + wikifield + "\n"; 
                
           wikifield = ""; 
       } 
    }
}

output += "}}\n"; 

// add record spesific categories 
var cats = context.doc[settings.categories]; 
if (Array.isArray(cats)) {
    for(var i = 0; i < cats.length; i++) {
        if(cats[i] != "")
            output += "[[Category:" + cats[i] + "]]\n"; 
    }
} else if (cats && cats != "" ) {
    output += "[[Category:" + cats + "]]\n"; 
}

// add categories for all images
if(settings.category_all && settings.category_all != "") {
	var splitted = settings.category_all.split("'");
	splitted.forEach(function(cat) {
		output += "[[Category:" + cat + "]]\n"; 
	})
}


// self promote
output += "[[Category:GLAMpipe uploads]]\n"; 

// extra stuff (like OTRS)
if(context.node.settings.extra)
    output += context.node.settings.extra;

if(parseInt(context.count) % 100 == 0) 
    out.say('progress', context.node.type.toUpperCase() + ': processed ' + context.count + '/' + context.doc_count);

// if there is a static value, we use that
// otherwise we use dynamic value if set
function setLangCodes(data, field_name) {
    var lang_static = settings[field_name + "_lang_static"];
    var lang_dyn = settings[field_name + "_lang_dyn"];
    if(lang_static && lang_static != "") {
        for(var i = 0; i < data.length; i++) {
          data[i] = "{{" + lang_static + "|" + data[i] + "}}";  
        }
    }
}

// out put wikitext
out.value = output; 

