
out.setter = {};
var info = context.data;

if(info && info.response)
	out.setter[context.node.params.out_field] = info.response;
else
	out.setter[context.node.params.out_field] = "AAAA_error: Mail not sent!";
