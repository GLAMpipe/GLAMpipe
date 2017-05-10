/* {_id:{$in:context.doc.ids}}  */

var updatequery = {}; 
var search = context.doc[context.node.params.in_field];
updatequery[context.node.params.compare_field] = {$in:context.doc[context.node.params.in_field]}; 

if(typeof search !== "undefined")
	out.pre_value = updatequery;
else
	out.pre_value = null;


// MUUTA TÄMÄ KÄYTTÄMÄÄN TAVALLISTA LOOPPIA (lue mappings muistiin)
