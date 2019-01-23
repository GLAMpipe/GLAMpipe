
var mongoquery	= require("../../app/mongo-query.js");

var exports = module.exports = {};


exports.createIndex = function (sandbox) {
	var collection = sandbox.context.node.params.collection;
	var field = {};
	field[sandbox.context.node.params.in_field] = 1;
	mongoquery.createIndex(collection, field, function(err, result) {
		sandbox.finish.runInContext(sandbox);
	})
}

exports.query = function (doc, sandbox, next) {

	// let node create a query
	sandbox.pre_run.runInContext(sandbox);
	var query = sandbox.out.pre_value.query;
	if(!query) {
		return next("skipping because of empty query");
	}
	var fields = sandbox.out.pre_value.fields;

	mongoquery.findFields(query, fields, {}, sandbox.context.node.params.required_source_collection, function(err, result) {
		sandbox.context.data = result;
		sandbox.run.runInContext(sandbox);
		next();
	})

}
