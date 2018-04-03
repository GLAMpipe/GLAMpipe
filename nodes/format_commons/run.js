

var c = context; 
var settings = context.node.settings; 
var wikifield = ''; 
var is_static = /_static$/;
var is_dynamic = /_dynamic$/;

var item = {"metadata": {}};

// get static field values
getStaticValues(item);
// get dynamic field values
getDynamicValues(item);

// generate wikitext
var templates = ["Photograph", "Map", "Artwork"]; 
var wikitext = '{{' + templates[parseInt(c.node.params.template)] + "\n"; 

if(item.metadata) {
	for(var key in item.metadata) {
		wikitext += "|" + key + " = ";
		item.metadata[key].forEach(function(fieldValue) {
			if(fieldValue.language) {
				wikitext += "{{" + fieldValue.language + "|" + fieldValue.value + "}}\n";
			} else {
				wikitext += fieldValue.value + "\n";
			}
		});
	}
}

wikitext += "}}\n"; 


//// add record spesific categories 
wikitext += addItemSpesificCategories();
// add categories for all images
wikitext += addGenericCategories();

// self promote category
wikitext += "[[Category:GLAMpipe uploads]]\n"; 

// extra stuff (like OTRS)
if(context.node.settings.extra) {
	wikitext += context.node.settings.extra;
}

// out put wikitext
out.value = wikitext; 

if(parseInt(context.count) % 100 == 0) {
	out.say("progress", context.node.type.toUpperCase() + ": processed " + context.count + "/" + context.doc_count);
}




/*********************** FUNCTIONS *********************/
function getStaticValues(item) {
	for(var key in context.node.settings) {
		if(is_static.test(key)) {
			var plain_key = key.replace("_static", "");
			if(context.node.settings[key])
				pushField(item, context.node.settings[key], plain_key, "");
		}
	}
}


function getDynamicValues(item) {
	for(var key in context.node.settings) {
		//out.console.log("KEY:" + key)
		var value = context.doc[context.node.settings[key]];
		// value might be undefined
		if(!value)
			value = "";
			
		let language = "";
		
		if(is_dynamic.test(key)) {
			var plain_key = key.replace("_dynamic", "");
			if(Array.isArray(value)) {
			   for (var i = 0; i < value.length; i++ ) { 
					language = getLanguage(plain_key, value[i], i);
					pushField(item, value[i], plain_key, language);	
			   }
		   } else { 
			   language = getLanguage(plain_key, value);
				pushField(item, value, plain_key, language);	
		   }
		}
	}
}

function addGenericCategories() {
	let text = "";
	if(settings.category_all && settings.category_all != "") {
		let splitted = settings.category_all.split("'");
		splitted.forEach(function(cat) {
			text += "[[Category:" + cat + "]]\n"; 
		})
	}
	return text;
}


function addItemSpesificCategories() {
	let text = ""; 
	let cats = context.doc[settings.categories]; 
	if (Array.isArray(cats)) {
		for(let i = 0; i < cats.length; i++) {
			if(typeof cats[i] === "string" && cats[i] != "")
				text += "[[Category:" + cats[i] + "]]\n"; 
		}
	} else if (typeof cats === "string"  && cats && cats != "" ) {
		text += "[[Category:" + cats + "]]\n"; 
	}
	return text;
}

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

	// get space back to template key names
	key = key.replace("_", " ");

	// do not add key if there is no mapped key
	if(value !== null && value !== "") { 
		if(!item.metadata[key]) {
			item.metadata[key] = [{"value": value, "language": language}];
		} else {
			item.metadata[key].push({"value": value, "language": language});
		}
	}
}


function getLanguage(plain_key, value, index) {

	let dyn_lang;
	if(settings[plain_key + "_dynamic_lang"] != "") {
		dyn_lang = context.doc[settings[plain_key + "_dynamic_lang"]];
	}

	if(typeof index === "undefined") {
		return setLanguage(plain_key);
		
	} else {
		if(dyn_lang && Array.isArray(dyn_lang)) {
			return setLanguage(plain_key, dyn_lang[index]);
		} else {
			return setLanguage(plain_key, dyn_lang);
		}
	}
}

function setLanguage(plain_key, dyn_lang) {
    const lang_static = settings[plain_key + "_static_lang"];
	if(lang_static && lang_static != "") {
		return lang_static;
	} else {
		if(dyn_lang) {
			return dyn_lang;
		}
	}
	return "";
}

