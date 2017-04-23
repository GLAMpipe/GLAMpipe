/* {_id:{$in:context.doc.ids}}  */
var query_value = context.doc[context.node.params.local_key];
if(query_value) {
	out.query = {}; 
	out.query[context.node.params.lookup_key] = {$in: query_value}; 
}
/* we add values to array in target field  */
var value = {"testi":""}; 
//value[context.node.params.out_field] = context.doc[context.node.params.copy_field]; 
out.setter = {$push:value}; 
             
