const MP 		= require("../config/const.js");
var exports 	= module.exports = {};

exports.search = function (req, res) {

	var limit = parseInt(req.query.limit);
	if (limit < 0 || isNaN(limit))
		limit = 15;

	var skip = parseInt(req.query.skip);
	if (skip <= 0 || isNaN(skip))
		skip = 0;

	var sort = req.query.sort
	if(sort === 'undefined')  // by default sort by _id (mongoid)
		sort = "_id";

	var reverse = false
	var r = parseInt(req.query.reverse);
	if(!isNaN(r) && r == 1)  // reverse if reverse is 1
		reverse = true;

	var operators = {};
	if(req.query.op && Array.isArray(req.query.op)) {
		req.query.op.forEach(function(op) {
			var s = op.split(":");
			if(s.length === 2) {
				if(s[1] === "or") 
					operators[s[0]] = "$in";
				else if(s[1] === "and") 
					operators[s[0]] = "$all";
			}
		})
	}

	var s = ["skip", "limit", "sort", "reverse", "op"];
	var query = {};
	for (var param in req.query) {
		if(!s.includes(param)) {
			if(Array.isArray(req.query[param])) {
				var q = {};
				if(operators[param])
					q[operators[param]] = req.query[param];
				else
					q = {$in:req.query[param]};
				query[param] = q;
			} else {
				query[param] = req.query[param];
			}
		}
	}
	console.log(query);
	//query[req.query.field] = {$regex:req.query.value, $options: 'i'};

	var params = {
		collection: req.params.collection,
		query: query,
		limit: limit,
		skip: skip,
		sort: req.query.sort,
		reverse: reverse
	}
	
	return params;


}
