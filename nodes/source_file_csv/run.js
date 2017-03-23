
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
		new_record[prop_clean] = [record[prop]];

	}
}




function cleanFieldName (field) {

	if(!context.node.settings.cleankeys) 
		return field;
	
	// clean up key names (remove -. and convert spaces to underscores)
	prop_trimmed = field.trim().toLowerCase();
	prop_clean = prop_trimmed.replace(/[\s.]/g, '_');
	return prop_clean;					
	
	// remove language code from field name
	//return  prop_clean.replace(/\[(.|..|)\]/g, '');

}
