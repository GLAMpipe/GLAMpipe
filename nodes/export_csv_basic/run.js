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

for(f in context.doc) {
    if(f != '__mp_source' && f != '_id') {
       if (context.doc[f] !== null && context.doc[f].constructor.name === 'Array') {
           var arr_row = []; 
           for (var i = 0; i < context.doc[f].length; i++ ) { 
               /* ignore objects in arrays */
               if (typeof context.doc[f][i] !== 'object') 
                   arr_row.push(getVal(context.doc[f][i])); 
           }
           var arr_str = quote(arr_row.join(c.arr_sep)); 
           row.push(arr_str); 
       } else {  
           row.push(quote(getVal(context.doc[f]))); 
       }
    }
};



if(parseInt(context.count) % 100 == 0) 
    out.say('progress', context.node.type.toUpperCase() + ': processed ' + context.count + '/' + context.doc_count);

out.value = row.join(c.sep) + '\\n'; 
