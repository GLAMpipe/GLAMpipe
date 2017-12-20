var c = context;
c.sep = context.node.settings.sep; 
c.arr_sep = context.node.settings.arr_sep; 


function getVal (val) { 
   if( typeof val == "string" || typeof val == "number")  
       return val; 
   else 
       return ''; 
}
            
   /* quote if there is a separator in value  */
function quote (str) {
   if(str.indexOf(c.sep) > -1) 
       return '"' + str + '"'; 
   else 
       return str; 
}
            
var row = [];

for(var i=0; i<out.csvheaders.length; i++) {

	var value = ""; // default value
	var key = out.csvheaders[i];
	if(context.doc[key]) {
	
		if (context.doc[key] !== null && Array.isArray(context.doc[key])) {
			var arr_row = []; 
			for (var j = 0; j < context.doc[key].length; j++ ) { 
				/* ignore objects in arrays */
				if (typeof context.doc[key][j] !== 'object') 
					arr_row.push(getVal(context.doc[key][j])); 
			}
			
			value = arr_row.join(c.arr_sep); 
			
		} else {  
		   value = getVal(context.doc[key]); 
		}
    }
	row.push(value);
};

context.count++;
//out.console.log(context.node.settings.fields);


if(parseInt(context.count) % 100 == 0) 
    out.say('progress', context.node.type.toUpperCase() + ': processed ' + context.count + '/' + context.doc_count);

out.value = row;
