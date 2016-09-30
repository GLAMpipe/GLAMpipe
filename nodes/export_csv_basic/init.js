var c = context;
c.sep = context.node.settings.sep; 
c.arr_sep = context.node.settings.arr_sep; 
            
var row = [];
for(f in context.doc_eka) {
    if(f != '__mp_source' && f != '_id') 
        row.push(f); 
};
out.value = row.join(c.sep) + '\\n'; 
