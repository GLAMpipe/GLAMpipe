
var record = context.data;
var new_record = {};
out.value = new_record;

if(!(context.vars.count % 1000)) 
	out.say("progress", context.vars.count + " imported");
	
context.vars.count++;

// create arrays for every key with clean field name
for(var prop in record) {

	if (record.hasOwnProperty(prop)) {

		prop_clean = cleanFieldName(prop);
		
		// extract language codes 
		if(context.node.settings.extract_language) {

			new_record[prop_clean] = [];
			new_record[prop_clean + "__lang"] = [];
			
		} else {
			new_record[prop_clean] = [record[prop]];
		}
	}
}


// push values to arrays
for(var prop in record) {

	if (record.hasOwnProperty(prop) && context.node.settings.extract_language) {

		// fist push value
		prop_clean = cleanFieldName(prop);
		new_record[prop_clean].push(record[prop]);
												
		// check for language code ([en], [fi] etc.)
		var re = /\[(.|..|)\]/g;
		prop_trimmed = prop.trim().toLowerCase();
		var codes = re.exec(prop_trimmed);
		
		// then push language code (i.e. what is inside square brackets)
		if(codes != null) {
			if(codes[1] != "") {
				new_record[prop_clean + "__lang"].push(codes[1]);
			} else {
				new_record[prop_clean + "__lang"].push("");
			}
		} else {
			new_record[prop_clean + "__lang"].push(""); 
		}
	}
}



function cleanFieldName (field) {

	// clean up key names (remove -. and convert spaces to underscores)
	prop_trimmed = field.trim().toLowerCase();
	prop_clean = prop_trimmed.replace(/[\s.]/g, '_');
	
	if(context.node.settings.extract_language)
		return  prop_clean.replace(/\[(.|..|)\]/g, ''); // remove language code from field name
	else
		return prop_clean;

}
