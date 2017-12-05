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

out.console.log("GET FIELDS")
for(var f in context.doc) {
	//out.console.log(f);
	if(out.csvheaders.includes(f)) {
		
       if (context.doc[f] !== null && Array.isArray(context.doc[f])) {
           var arr_row = []; 
           for (var i = 0; i < context.doc[f].length; i++ ) { 
               /* ignore objects in arrays */
               if (typeof context.doc[f][i] !== 'object') 
                   arr_row.push(getVal(context.doc[f][i])); 
           }
           var arr_str = arr_row.join(c.arr_sep); 
           row.push(arr_str); 
       } else {  
           row.push(getVal(context.doc[f])); 
       }
    }
};

context.count++;
//out.console.log(context.node.settings.fields);


if(parseInt(context.count) % 100 == 0) 
    out.say('progress', context.node.type.toUpperCase() + ': processed ' + context.count + '/' + context.doc_count);

out.value = row;
