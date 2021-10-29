const util 		= require('util');
var pdfUtil		= require('pdf-to-text');

exports.toText_test = async function (node, file) {

	const fs = require("fs-extra");
	const path = require("path");

	return new Promise(function(resolve, reject) {
		pdfUtil.pdfToText(file, function(err, data) {
			if (err !== null) reject(err);
			else {
				pdfUtil.info(file, function(err, info) {
					if (err !== null) reject(err);
					else {
						resolve({'text': data, 'info': info})
					}
				})
			}
		});
	});
}
