

var search = {"compare": [], "replace": []};
// dynamic values overrides static values
var is_static = /^_static_/;
var is_dynamic_search = /^_dynamic_search/;
var is_dynamic_replace = /^_dynamic_replace/;

/*
// handle static fields
for(var key in context.node.settings) {
	if(is_static.test(key)) {
		var plain_key = key.replace("_static_", "");
		if(context.node.settings[key])
			search[plain_key] = context.node.settings[key];

	}
}


// then override with dynamic fields if set
for(var key in context.node.settings) {
	var value = context.doc[context.node.settings[key]];
	if(is_dynamic_search.test(key)) {
		search.compare.push(value);
		search.compare.push(value);
	} else if(is_dynamic_replace.test(key)) {
		search.replace.push(value);
	}
}
*/
var search_term = context.doc[context.node.settings._dynamic_search1];
var replace_term = "";

/*
{
	search: [
	"",
	"sdf"
	],
	replace: [
		"jotain",
		"toista"
	]
}
* */
// {search1: [""], replace1: ["jotain"], search2: ["sdf"], replace2: ["toista"]}

out.console.log(search);

if(context.doc[context.node.params.in_field]) {
	
	// node input
    var value = context.doc[context.node.params.in_field]; 
    
    // search is array
	if(Array.isArray(search_term)) {

		for (var i=0; i < search_term.length; i++) { 
			
			var reg = new RegExp(search_term[i], "g"); 
			
			if(value !== null) {
				
				if( typeof value === "string") {
					
					// process string
					value = replace(value, reg, replace_term);
					
				} else if (Array.isArray(value)) {
					
					// process array
					for (j = 0; j < value.length; j++) { 
						value[j] = replace(value[j], reg, replace_term, j) 
					}
				}
			}
		}		
	
	// search is 
	} else {

		var reg = new RegExp(context.node.settings.search_term, "g"); 
		
		if(value !== null) {
			
			if( typeof value === "string") {
				
				// process string
				value = replace(value, reg, replace_term);
				
			} else if (Array.isArray(value)) {
				
				// process array
				for (j = 0; j < value.length; j++) { 
					value[j] = replace(value[j], reg, replace_term, j);
				}
			}
		}

	}

   
   // add start and end
   if (Array.isArray(value)) {
		for (j = 0; j < value.length; j++) { 
			if(value[j] != "")
				value[j] = context.node.settings.add_start + value[j] + context.node.settings.add_end; 
		}	   
   } else {
	   if(value != "")
			value = context.node.settings.add_start + value + context.node.settings.add_end;
	}
   
   // node output
   out.value = value;

} else { 
   out.value = ""; 
}


function replace(value, reg, replace_term, index) {
	
	if(typeof index !== "undefined") {
		
		if(Array.isArray(replace_term)) {
			if(replace_term[index])
				return value.replace(reg, replace_term[index]);
			else
				return value.replace(reg, replace_term[0]);
		} else {
			return value.replace(reg, replace_term); 
		}		
		
	} else {
		if(Array.isArray(replace_term)) {
			return value.replace(reg, replace_term[0]);
		} else {
			return value.replace(reg, replace_term); 
		}	
	}

}
