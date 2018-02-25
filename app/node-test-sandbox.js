var validator 	= require('validator');
var parser 		= require('xml2json');
// creates sandbox for node tests

exports.createSandbox = function (node) {
	// context for node scripts
	var sandbox = {
		context: {
			doc: null,
			data: null,
			vars: {},
			myvar: {},
			node: node,
			doc_count:0,
			count:0,
			validator: validator,
			parser: parser
		},
		out: {
			pre_value:"",
			value:"",
			url: "",
			file:"",
			setter:null,
			updatequery: null,
			error: null,
			console:console,
			schema: [],
			key_type: [],
			say: function(ch, msg) {
				console.log(ch.toUpperCase() + ":", msg);
			}
		}
	};
	
	return sandbox;
}
