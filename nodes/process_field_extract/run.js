function extract (val) { 
   var extracted = []; 
   
   // check if input is array
   if (Array.isArray(val)) {
       for (var i = 0; i < val.length; i++) { 
           var extracted2 = extract(val[i]); 
           /* push result  */
           if(extracted2) {
			   for (var j = 0; j < extracted2.length; j++) {
				   extracted.push(extracted2[j]); 
			   }
		   }
       }
       
   // if not array, then assume string
   } else {  

	   var regex = new RegExp(context.node.settings.regexp, "g");

		while ((m = regex.exec(val)) !== null) {
			// This is necessary to avoid infinite loops with zero-width matches
			if (m.index === regex.lastIndex) {
				regex.lastIndex++;
			}
			// we take only first from match groups
			if(m[0])
				extracted.push(m[0]);
			// The result can be accessed through the `m`-variable.
			//m.forEach((match, groupIndex) => {
				//console.log(`Found match, group ${groupIndex}: ${match}`);
			//});
		}
         
   }
   return extracted;
}
            
var val = context.doc[context.node.params.in_field]; 

if (val != null) {
	var arr = extract(val)
	if(context.node.settings.only_first)
		out.value = arr[0];
	else
		out.value = arr;
}



	//var regex = new RegExp(/([A-ZÅÄÖ][\wåäö"-]+|\sde\b|\sla\b|\von\b)(\s[A-ZÅÄÖ"][\wåäö"-]*|\sde\b|\sla\b|\von\b)*/g);
	//var str = `apupappi ja Pekka Koskela ja Urpo von Tiainen ja Matti Möttönen vuonna 1998 ja 2013`;
	//var m;
	
	//while ((m = regex.exec(str)) !== null) {
	    //// This is necessary to avoid infinite loops with zero-width matches
	    //if (m.index === regex.lastIndex) {
	        //regex.lastIndex++;
	    //}
	    
	    //// The result can be accessed through the `m`-variable.
	    //m.forEach((match, groupIndex) => {
	        //console.log(`Found match, group ${groupIndex}: ${match}`);
	    //});
	//}

