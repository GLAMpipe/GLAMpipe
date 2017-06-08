var c = context; 

var data = context.parser.toJson(c.data);
var json = JSON.parse(data);
out.value = json;
context.vars.total_count++;

