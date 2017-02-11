/* {_id:{$in:context.doc.ids}}  */
out.updatequery = {}; 
out.updatequery[context.node.settings.match] = {$in:context.doc[context.node.settings.search]}; 
context.data = updatequery;
