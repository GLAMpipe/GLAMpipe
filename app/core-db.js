const vm 		= require("vm");
var mongoist 	= require("mongoist")
var db 			= require('./db.js');
var pdf 		= require('./cores/pdf.js');
const GP 		= require("../config/const.js");

var exports 	= module.exports = {};

exports.process = {

	'collection': {
		'index': async function(node) {
			var field = {};
			field[node.source.params.in_field] = 1;
			var r = await db[node.collection].createIndex(field);
			node.scripts.finish.runInContext(node.sandbox);
		}
	}
}
