const util 		= require('util');
var debug 		= require('debug')('QUERY');
const MP 		= require("../config/const.js");
var exports 	= module.exports = {};

exports.search = function (params) {

	var skipped = ["mongoquery", "keys", "nokeys", "skip", "limit", "sort", "reverse", "op", "rev_op"]; 	// skip search options
	var operators = exports.operators(params);					// field spesific operators (e.g. "&op=dc_type:or")
	//var query = exports.filters(req, operators, skipped);
	//var query = exports.createSearchQuery(params, skipped);

	// remove reserved keys from query
	var cleanParams = {}
	for(var p in params) {
		if(!skipped.includes(p)) {
			cleanParams[p] = params[p];
		}
	}

	var query = {}
	if(params.mongoquery) {
		try {
			query = JSON.parse(params.mongoquery);
		} catch(e) {
			throw(new Error('Query is invalid. It must be a JSON'))
		}
	} else {
		query = exports.createSearchQuery(cleanParams, operators);
	}

	var limit = parseInt(params.limit);
	if (limit < 0 || isNaN(limit))
		limit = 15;

	var skip = parseInt(params.skip);
	if (skip <= 0 || isNaN(skip))
		skip = 0;

	// keys that are wanted
	var keys = {};
	if(typeof params.keys !== 'undefined') {
		arrKeys = params.keys.split(",");
		arrKeys.forEach((key) => {
			keys[key.trim()] = 1;
		})
	}

	// keys that are not wanted
	if(typeof params.nokeys !== 'undefined') {
		arrKeys = params.nokeys.split(",");
		arrKeys.forEach((key) => {
			keys[key.trim()] = 0;
		})
	}

	var reverse = 1
	var r = parseInt(params.reverse);
	if(!isNaN(r) && r == 1)  // reverse if reverse is 1
		reverse = -1;


	sort = {};
	if(typeof params.sort === 'undefined' || params.sort == "") { // by default sort by _id (mongoid)
		sort._id = reverse;
	} else {
		var sort_keys = params.sort.split(",")
		for(const sort_key of sort_keys) {
			sort[sort_key.trim()] = reverse;
		}
	}

	var search = {
		query: query,
		limit: limit,
		skip: skip,
		sort: sort,
		keys: keys,
		reverse: reverse
	}

	debug(util.inspect(search, false, 4, true));

	return search;
}


function decode (params) {
	if(Array.isArray(params)) {
		params.forEach(function(param, index, arr) {
			arr[index] = decodeURIComponent(param);
		})
		return params;
	} else {
		return decodeURIComponent(params);
	}
}

exports.filters = function (req, operators, skip, as_array) {
		var query = {};
		var arr = [];
		for (var param in req.query) {
			if(!skip.includes(param)) {
				var p = decode(req.query[param]);
				if(Array.isArray(p)) {
					var q = {};
					if(operators[param])
						q[operators[param]] = p;
					else
						q = {$all:p};  // default AND

					if(as_array)
						arr.push({[param]:q});
					else
						query[param] = q;

				} else {
					if(as_array)
						arr.push({[param]:p})
					else
						query[param] = p;
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


exports.operators = function (params) {
	var operators = {};
	if(params.op) {
		if(Array.isArray(params.op)) {
			for(var op of params.op) {
				split(op)
			}
		} else {
			split(params.op)
		}
	}

	function split(op) {
		var splitted = op.split(":");
		if(splitted.length === 2) {
			if(splitted[1] === "or")
				operators[splitted[0]] = "$in";
			else if(splitted[1] === "and")
				operators[splitted[0]] = "$all";
			else if(splitted[1] === "not")
				operators[splitted[0]] = "$not";
		}
	}
	//console.log("OPERATORS:\n" + util.inspect(operators, false, 4, true));
	return operators;
}

exports.opParam = function(value) {
	var splitted = value.split(":");
	if(splitted.length === 2 && splitted[0] === 'regex') {
		return {$regex: splitted[1]}
	} else {
		return value;
	}
}

exports.createSearchQuery = function(params, operators) {
	//console.log("createsearchquery")
	//console.log(Object.keys(params))
	//console.log(params)

	if(Object.keys(params).length == 0) return {};


	var query = {};
	for(param in params) {
		if(Array.isArray(params[param])) {
		// create an AND query if there are several query fields
			var ands = [];
			if(operators[param]) {
				for(var value of params[param]) {
					ands.push(exports.opParam(decodeURIComponent(value)))
				}
				query[param] = {};
				query[param][operators[param]] = ands;
			} else {
				for(var value of params[param]) {
					var search = {};
					search[param] = value;
					ands.push(search);
				}
				query.$and = ands;
			}

		// otherwise create query for one field
		} else {
			if(operators[param] && operators[param] === '$not') {
				if(params[param] === '*') query[param] =  {$not:{$regex: '\S'}}; // match any non whitespace character
				else query[param] =  {$ne: exports.opParam(decodeURIComponent(params[param]))};
			} else {
				if(params[param] === '*') query[param] =  {$regex: '\S'}; // match any non whitespace character
				else query[param] =  exports.opParam(decodeURIComponent(params[param]));
			}
		}
	}
	debug('*** query:')
	debug(query)
	debug('query ends ***')
	return query;
}
