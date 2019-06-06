const util 		= require('util');
var pdfUtil		= require('pdf-to-text');

exports.toText = async function (node) {
	
	const fs = require("fs-extra");
	const path = require("path");

	var  file = "/Users/arihayri/Downloads/museo_yleiso_ja_avoimet_aineistot_2018.pdf"

    return new Promise(function(resolve, reject) {
        pdfUtil.pdfToText(file, function(err, data) {
            if (err !== null) reject(err);
            else resolve(data);
        });
    });

}

