var c = context; 

var data = context.parser.toJson(c.data);
var json = JSON.parse(data);
out.value = {
    "title": json
    };
context.vars.total_count++;

