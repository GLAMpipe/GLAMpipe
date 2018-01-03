


var collection = context.doc[context.node.params.in_collection];
var community = context.doc[context.node.params.in_community];

if(Array.isArray(collection))
	collection = collection[0];

if(Array.isArray(community))
	community = community[0];

out.url = context.node.params.required_url + "/communities/" +community+ "/collections/";

var item = {'name': collection};

var options = {
	url: out.url,  
	json: item,
	headers: {
		"accept": "application/json"
	},
	jar:true
};



// if there is value in out_field, then we do not run again
if(context.doc[context.node.params.out_field])
	context.skip = true;

// do not proceed with empty content
if(item)
	out.pre_value = options;


if(parseInt(context.count) % 10 == 0) 
    out.say("progress", context.node.type.toUpperCase() + ": processed " + context.success_count + "/" + context.doc_count);






