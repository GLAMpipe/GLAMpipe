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

	   var reg = new RegExp(context.node.settings.regexp);
	   return val.match(reg);
         
   }
   return extracted;
}
            
var val = context.doc[context.node.params.in_field]; 

if (val != null) 
    out.value = extract(val);



const regex = /([A-ZÅÄÖ][\wåäö"-]+|\sde\b|\sla\b|\von\b)(\s[A-ZÅÄÖ"][\wåäö"-]*|\sde\b|\sla\b|\von\b)*/g;
const str = ``;
let m;
/*
while ((m = regex.exec(str)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
        regex.lastIndex++;
    }
    
    // The result can be accessed through the `m`-variable.
    m.forEach((match, groupIndex) => {
        console.log(`Found match, group ${groupIndex}: ${match}`);
    });
}
*/
