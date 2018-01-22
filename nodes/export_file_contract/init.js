
var template = context.node.params.template;
context.vars = {};

var date = new Date();
var y =  date.getUTCFullYear();
var m =  date.getMonth() + 1;
var d =  date.getDate();
context.vars.date = y + "-" + m + "-" + d;

// find keys in template
var keys = []
var t = template.split("[[");
t.forEach(function(bit) {
	if(bit.includes("]]")) {
		var l = bit.split("]]");
		var key = l[0];
		keys.push(key);
	}
})

out.console.log("NODE: template keys:");
out.console.log(keys);

context.vars.keys = keys;
