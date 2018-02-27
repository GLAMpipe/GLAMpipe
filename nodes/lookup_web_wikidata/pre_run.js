
var url = "https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&ids="

var wid = context.doc[context.node.params.in_field];

if(wid && wid !== "") {
	// we need to find out if wid is plain string or url (like http://www.wikidata.org/entity/Q28529650)
	if(!/^Q[0-9]*$/.test(wid)) {
		
		var s = wid.split("entity/");
		if(s[1]) {
			if(/^Q[0-9]*$/.test(s[1])) 
				wid = s[1];
			else
				wid = "";
		} else {
			wid = "";
		}
		
	} 
}

if(wid && wid !== "") {
	
	var options = {url: url + wid}
	out.pre_value = options;
	
} else {
	out.pre_value = null;
	context.error = "no WD entity found!"
}



