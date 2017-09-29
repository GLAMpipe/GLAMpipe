

var c = context; 
var settings = context.node.settings; 
var wikifield = ''; 


var item = {"metadata": {}};




var is_static = /_static/;
var is_dynamic = /_dynamic$/;


// handle static fields
for(var key in context.node.settings) {
	if(is_static.test(key)) {
		var plain_key = key.replace("_static", "");
		if(context.node.settings[key])
			pushField(item, context.node.settings[key], plain_key, "");
	}
}

// then override with dynamic fields if set
for(var key in context.node.settings) {
	//out.console.log("KEY:" + key)
	var value = context.doc[context.node.settings[key]];
	// value might be undefined
	if(!value)
		value = "";
		
	var language = "";
	
	if(is_dynamic.test(key)) {
		
		var plain_key = key.replace("_dynamic", "");
		out.console.log("PLAIN key:" + plain_key)
		if(context.doc[context.node.settings[key]])
		out.console.log("key value:" + value)

		   if(Array.isArray(value)) {
			   for (var i = 0; i < value.length; i++ ) { 
					if(context.doc[plain_key + "__lang"])
						language = context.doc[plain_key + "__lang"][i];
					pushField(item, value[i], plain_key, language);	
			   }
		   } else { 
				if(context.doc[plain_key + "__lang"])
					language = context.doc[plain_key + "__lang"];
				pushField(item, value, plain_key, language);	
		   }
	}
}



if(parseInt(context.count) % 10 == 0) 
    out.say("progress", context.node.type.toUpperCase() + ": processed " + context.count + "/" + context.doc_count);



/*********************** FUNCTIONS *********************/

function splitValue (val) { 
   if( typeof val == "string") { 
       var arr = val.split("||"); 
       return arr 
   } else if ( typeof val == "number") {
       return val; 
   }
}



function pushField (item, value, key, language) {

	if(typeof value === "string")
		value = value.trim();

	// do not add key if there is no mapped key
	if(value !== null && value !== "") { 

		item.metadata[key] = {"value": value, "language": language};
		
	}
}


out.console.log(item)

// write wikitext
var templates = ["Photograph", "Map", "Artwork"]; 
var wikitext = '{{' + templates[parseInt(c.node.params.template)] + "\n"; 

if(item.metadata) {
	for(var key in item.metadata) {
		wikitext += "|" + key + " = " + item.metadata[key].value + "\n";
	}
}

wikitext += "}}\n"; 













// TITLES
//wikitext += "|title = " + makeValues("title") + "\n";
//wikitext += "|description = " + makeValues("description") + "\n";
// TITLE languages





//// add record spesific categories 
//var cats = context.doc[settings.categories]; 
//if (Array.isArray(cats)) {
    //for(var i = 0; i < cats.length; i++) {
        //if(cats[i] != "")
            //wikitext += "[[Category:" + cats[i] + "]]\n"; 
    //}
//} else if (cats && cats != "" ) {
    //wikitext += "[[Category:" + cats + "]]\n"; 
//}

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


var output = {};
output[context.node.params.out_field] = wikitext;

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
