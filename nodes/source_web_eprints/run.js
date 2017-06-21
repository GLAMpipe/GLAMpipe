var c = context; 

if(context.response.statusCode == 200) {

    var data = context.parser.toJson(c.data);
    var json = JSON.parse(data);
    out.value = {
        "title": json
        };
    context.vars.total_count++;

} else {
    out.value = {
        "title": context.response.statusCode
        };
}

