
var c = context; 
var templates = ["Photograph", "Map", "Artwork"]; 
var wikitext = '{{' + templates[parseInt(c.node.params.template)] + "\n"; 
var settings = context.node.settings; 
var wikifield = ''; 



// TITLES
wikitext += "|title = " + makeValues("title") + "\n";
wikitext += "|description = " + makeValues("description") + "\n";
// TITLE languages


// DESCRIPTIONS
            
for (key in settings) {
    if (key.indexOf('_wt_') === 0) {       
       if (key.indexOf('_wt_1') === 0 || key.indexOf('_wt_3') === 0 || key.indexOf('_wt_5') === 0 ) { 
           wikifield += settings[key]; 
       } else {
           wikifield += c.get(context.doc, settings[key]); 
       }
            
/* set wikitext on last field of series */
       if (key.indexOf('_wt_5') === 0 ) { 
           var stripped = key.replace(/_wt_5_/,''); 
           if(wikifield !== "")
                wikitext += "|" + stripped + " = " + wikifield + "\n"; 
                
           wikifield = ""; 
       } 
    }
}

wikitext += "}}\n"; 

// add record spesific categories 
var cats = context.doc[settings.categories]; 
if (Array.isArray(cats)) {
    for(var i = 0; i < cats.length; i++) {
        if(cats[i] != "")
            wikitext += "[[Category:" + cats[i] + "]]\n"; 
    }
} else if (cats && cats != "" ) {
    wikitext += "[[Category:" + cats + "]]\n"; 
}

// add categories for all images
if(settings.category_all && settings.category_all != "") {
	var splitted = settings.category_all.split("'");
	splitted.forEach(function(cat) {
		wikitext += "[[Category:" + cat + "]]\n"; 
	})
}


// self promote
wikitext += "[[Category:GLAMpipe uploads]]\n"; 

// extra stuff (like OTRS)
if(context.node.settings.extra)
    wikitext += context.node.settings.extra;

if(parseInt(context.count) % 100 == 0) 
    out.say('progress', context.node.type.toUpperCase() + ': processed ' + context.count + '/' + context.doc_count);


// create page title
var title = makeValues("page", true);
if(context.node.settings.file_extension)
	title = title + "." + context.doc[context.node.settings.file_extension];
	
title = title.replace(/\.+/g, "."); // remove possible double dots (like "name..jpg")
var output = {};
output[context.node.params.out_field] = wikitext;
output[context.node.params.out_title] = title;

// out put wikitext
out.setter = output; 





function getValue(field) {
	if(typeof field === "undefined" || field === "")
		return "";
		
	var value = context.doc[field];
	if(typeof value === "undefined")
		return "";
	return value;
}


function makeValues(field, noLang) {

    var values 	= [];
    
	values.push(joinInputs(field, noLang))

    if(!noLang)
		setLangCodes(values, field);
		
    return values.join("\n");  
}


function joinInputs(field, noLang) {
	var dyn1 	= settings[field + "_dyn1"];
	var dyn2 	= settings[field + "_dyn2"];

	
    var dyn1_value = getValue(dyn1);
    var dyn2_value = getValue(dyn2);
    out.console.log(dyn2_value)
    var arr = [];
    
	// if both are arrays
	if(Array.isArray(dyn1_value) && Array.isArray(dyn2_value)) {
		var max = Math.max(dyn1_value.length, dyn2_value.length);
		for(var i = 0; i < max; i++) {
			if(dyn1_value[i]) {
				if(dyn2_value[i]) 
					arr.push(join(field, dyn1_value[i], dyn2_value[i]));
				else
					arr.push(join(field, dyn1_value[i], ""));
					
			} else {
				arr.push(join(field, "", dyn2_value[i]));
			}
					
		}
	// if one is array
	} else if (Array.isArray(dyn1_value)) {
		dyn1_value.forEach(function(element) {
			arr.push(join(field, element, dyn2_value));
		})
	} else if (Array.isArray(dyn2_value)) {
		dyn2_value.forEach(function(element) {
			arr.push(join(field, dyn1_value, element));
		})
	// else both are strings
	} else {
		arr = join(field, dyn1_value, dyn2_value);
	}
	
	return arr;

}




function join (field, val1, val2) {
	var static1 = settings[field + "_static1"];
	var static2 = settings[field + "_static2"];
	var static3 = settings[field + "_static3"];
	var str = [];
	str.push(static1);
	str.push(val1);
	str.push(static2);
	str.push(val2);
	str.push(static3);
	return str.join("");
}



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
