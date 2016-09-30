

var base_url = context.node.params.dspace_url;
var collection_id = context.vars.collections[context.vars.initial_round_counter];

out.say("progress", "fetching from collection " + collection_id);
out.url = base_url + "/collections/" + collection_id + context.vars.query_path + "&limit=" + context.vars.offset;

