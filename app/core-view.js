


var db = require('./db.js');
var facet 		= require('./cores/view-facet.js');
const GP 		= require("../config/const.js");

var exports 	= module.exports = {};

exports.view = {

	"data": {
		"facet": async function(node) {
			await facet.createView(node);
		}
	}
}

