function split (val) { 
   var splitted = []; 
   if (val.constructor.name === 'Array' ) {
       for (var i = 0; i < val.length; i++) { 
           var splitted2 = split(val[i]); 
           /* push result  */
           for (var j = 0; j < splitted2.length; j++) {
               splitted.push(splitted2[j]); 
           }
       }
   } else {  
       var splitted = val.split(context.node.settings.separator);
       for (var i = 0; i < splitted.length; i++ ) 
           splitted[i] = splitted[i].trim(); 
   }
   return splitted;
}
            
var val = context.doc[context.node.params.in_field]; 
out.value = split(val);  
