
var get = context.get; 
var doc = context.doc; 
var settings = context.node.settings; 
var arr = []; 

arr.push(settings.prefix); 
arr.push(get(doc, settings.field1)); 
arr.push(settings.after_field1); 
arr.push(get(doc, settings.field2)); 
arr.push(settings.after_field2); 
arr.push(get(doc, settings.field3)); 
arr.push(settings.suffix); 

out.value = arr.join(""); 