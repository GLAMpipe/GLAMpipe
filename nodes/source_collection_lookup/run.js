/* {_id:{$in:context.doc.ids}}  */
out.updatequery = {}; 
out.say('progress', context.doc.name); 
out.updatequery._id = {$in:context.doc.ids}; 

/* we add values to array in target field  */
var value = {}; 
value[context.node.params.out_field] = context.doc[context.node.params.copy_field]; 
  if(context.node.settings.mode == 'single') 
    out.setter = {$set:value};  
else
    out.setter = {$push:value}; 
            
out.say('progress', JSON.stringify(out.updatequery)); 
out.say('progress', JSON.stringify(out.setter)); 
out.mongoDBupdate = true;  
