const util 		= require('util');
var pdfUtil		= require('pdf-to-text');




exports.toText = function (node, file) {
	
	const fs = require("fs-extra");
	const path = require("path");

	file = "/home/arihayri/Downloads/testi.pdf"

	return new Promise(function(resolve, reject) {
		pdfUtil.pdfToText(file, function(err, data) {
			if (err !== null) {
				console.log('rejecting');
				reject(err);
			}
			else {
				console.log('resolving')
				var r = function() {
					reject(new Error('sd'));
				}
				setTimeout(r, 3000)
				//resolve('sdf')
			}
		});
	});
}




exports.toText_test = function (node, file) {
	
	const fs = require("fs-extra");
	const path = require("path");

	file = "/home/arihayri/Downloads/DOI.zip"

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

