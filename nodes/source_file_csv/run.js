/*
note on language extract:
array rows must match between values and language codes!

*/

var record = context.data;
var new_record = {};
out.value = new_record;

if(!(context.vars.count % 1000)) 
	out.say("progress", context.vars.count + " imported");
	
context.vars.count++;

// FIRST ROUND
// create arrays for every key with clean field name
for(var prop in record) {

	if (record.hasOwnProperty(prop)) {

		prop_clean = cleanFieldName(prop);
		var values = processValue(record[prop]);
		
		// if field exists already, then concat values to existing array
		if(new_record[prop_clean]) {
			new_record[prop_clean] = new_record[prop_clean].concat(values);
		// else create field and copy values to new array
		} else {
			new_record[prop_clean]  = values;
		}

		if(context.node.settings.extract_language) {

			var code = getLanguageCode(prop);
			if(code != null) {
				// create languag array with empty strings if needed
				if(!new_record[prop_clean + "__lang"]) {
					new_record[prop_clean + "__lang"] = createLanguageArray(values.length, new_record[prop_clean].length);
				} 
				
				// push language code for every new value (i.e. what is inside square brackets)
				for(var i = 0; i < values.length; i++) {
					new_record[prop_clean + "__lang"].push(code);
				}
			}
		}
	}
}


function createLanguageArray(new_len, all_len) {
	
	 /* we must fill *new* lang field with empty strings if there are previous values
	 * this means that there was already a field or fields without language code */
	var arr = [];
	if(new_len < all_len) {
		var count = all_len - new_len;
		for(var i = 0; i < count; i++) {
			arr.push("");
		}
	}
	return arr;
		
}


function getLanguageCode(name) {
		// check for language code ("[en]" or "_en")
		var code = null;
		//var re = /\[(.|..|)\]/g;
		var re = /\[(..)\]$|(_..$)/
		name_trimmed = name.trim().toLowerCase();
		var codes = re.exec(name_trimmed);
		if(codes != null && Array.isArray(codes) && codes.length > 0) {
			if(codes[1])
				code = codes[1];
			else if (codes[2])
				code = codes[2].replace("_","");
		}
		return code;	
}


function processValue (value) {
	if(context.node.settings.split != "") {
		var arr = value.split(context.node.settings.split);
		
		// trim
		if(context.node.settings.trim) {
			arr = arr.map(function (e) {
				return e.trim();
			});
		}
		
		// skip empty
		if(context.node.settings.skip) {
			arr = arr.filter(Boolean)
		}
		
		return arr;
		
	} else {
		// skip
		if(context.node.settings.skip)
			if(value == "")
				return [];
		// trim
		if(context.node.settings.trim) {
			value = value.trim();
			if(context.node.settings.skip)
				if(value == "")
					return [];
			return [value];
		}
		else
			return [value];
	}	
}

function cleanFieldName (field) {

	// clean up key names (remove -. and convert spaces to underscores)
	prop_trimmed = field.trim().toLowerCase();
	prop_clean = prop_trimmed.replace(/[\s.]/g, '_');
	
	if(context.node.settings.extract_language) {
		prop_clean = prop_clean.replace(/\[(.|..|)\]$/, ''); // remove language code from field name ("[en]")
		return  prop_clean.replace(/_..$/, ''); // remove language code from field name ("_en")
	} else
		return prop_clean;

}
