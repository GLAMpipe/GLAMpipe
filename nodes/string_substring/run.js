function extract (val) { 
   var extracted = []; 
   
   // check if input is array
   if (Array.isArray(val)) {
       for (var i = 0; i < val.length; i++) { 
           var extracted2 = extract(val[i]); 
           /* push result  */
           for (var j = 0; j < extracted2.length; j++) {
               extracted.push(extracted2[j]); 
           }
       }
       
   // if not array, then assume string
   } else {  
       if(context.node.settings.from != "") {
			var start = val.split(context.node.settings.from); 
			if(start.length > 1) {
               if(context.node.settings.end != "") {
                   var end = start[1].split(context.node.settings.end); 
                   if(end.length > 1) 
                       extracted.push(end[0]); 
            
               /* end is empty  */
               } else {
                   extracted.push(start[1]); 
               }
           }
            
       /* start is empty  */
       } else {
           var start = val;
           if(context.node.settings.end != "") {
               var end = start.split(context.node.settings.end); 
               if(end.length > 1) 
                   extracted.push(end[0]); 
            
            /* end is empty  */
           } else { 
                   extracted.push(start); 
           }
       }
            

   }
   return extracted;
}
            
var val = context.doc[context.node.params.in_field]; 

if (val != null) 
    out.value = extract(val);
