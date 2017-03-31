const util 		= require('util');
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

	var skipped = ["skip", "limit", "sort", "reverse", "op"]; 	// skip search options
	var operators = exports.operators(req);					// field spesific operators (e.g. "&op=dc_type:or")
	var query = exports.filters(req, operators, skipped);

	var params = {
		collection: req.params.collection,
		query: query,
		limit: limit,
		skip: skip,
		sort: req.query.sort,
		reverse: reverse
	}

	console.log("SEARCH:\n" + util.inspect(params, false, 4, true));
	
	return params;
}

exports.filters = function (req, operators, skip, as_array) {
	var query = {};
	var arr = [];
	for (var param in req.query) {
		if(!skip.includes(param)) {
			if(Array.isArray(req.query[param])) {
				var q = {};
				if(operators[param])
					q[operators[param]] = req.query[param];
				else
					q = {$in:req.query[param]};
					
				if(as_array) 
					arr.push({[param]:q});
				else
					query[param] = q;
					
			} else {
				if(as_array)
					arr.push({[param]:req.query[param]})
				else
					query[param] = req.query[param];
			}
		}
	}
	
	if(as_array) {
		//console.log("FILTERS:\n" + util.inspect(arr, false, 4, true));
		return arr;
	} else {	
		//console.log("FILTERS:\n" + util.inspect(query, false, 4, true));
		return query;
	}
}

exports.operators = function (req) {
	var operators = {};
	if(req.query.op && Array.isArray(req.query.op)) {
		req.query.op.forEach(function(op) {
			var splitted = op.split(":");
			if(splitted.length === 2) {
				if(splitted[1] === "or") 
					operators[splitted[0]] = "$in";
				else if(splitted[1] === "and") 
					operators[splitted[0]] = "$all";
			}
		})
	} 
	//console.log("OPERATORS:\n" + util.inspect(operators, false, 4, true));
	return operators;
}


