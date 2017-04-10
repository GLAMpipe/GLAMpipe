/* {_id:{$in:context.doc.ids}}  */

var updatequery = {}; 
var search = context.doc[context.node.settings.local_key];
updatequery[context.node.settings.lookup_key] = {$in:context.doc[context.node.settings.local_key]}; 

if(typeof search !== "undefined")
	out.pre_value = updatequery;
else
	out.pre_value = null;
