// this create urls for fetching xml files

context.vars = {};
context.vars.total_count = 0;
var url = "http://demoprints.eprints.org/rest/eprint/";

context.pre_value = [];
var re = /(?:')([0-9]{1,4}\.xml)/g;
var str = context.data;
var arr;
while ((arr = re.exec(str)) !== null) {
  context.pre_value.push(url + arr[1]); 
}
