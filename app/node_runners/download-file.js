var mongojs 	= require('mongojs');
const vm 		= require('vm');
var path        = require('path');
var mongoquery 	= require("../../app/mongo-query.js");
var collection = require("../../app/collection.js");
const MP 		= require("../../config/const.js");


var exports = module.exports = {};



exports.downloadFile = function (doc, sandbox, cb ) {
	
	var fs = require("fs");
	var async = require("async");
	var request = require("request")

	var node = sandbox.context.node;

	// ask URLs from "pre_run" script
	sandbox.pre_run.runInContext(sandbox);
	var downloads = sandbox.out.urls;


	if (downloads && downloads.constructor.name == "Array") {
		
		sandbox.context.data = [];
		var counter = 0;
		sandbox.out.value = []
		
		console.log("DOWNLOADS:", downloads);
		
		async.eachSeries(downloads, function iterator(download, next) {

			console.log("downloading:", download);
			
			// dry run
			if(node.settings.dry_run) {
				checkUrl(download);
				next();
			
			// actual run
			} else {
				download(node, sandbox, next);
			}
			
		}, function done() {
			sandbox.run.runInContext(sandbox);
			var setter = {};
			setter[node.out_field] = sandbox.out.value;
			mongoquery.update(node.collection, {_id:sandbox.context.doc._id},{$set:setter}, cb);			
		})
		
	} else {
		console.log("Node error: input should be array");
		next();
	}    
   
}


function checkUrl (download) {
	
	if(download.url == null || download.url == "") {
		download.error = "URL missing";
	} else if(download.url.search("http") != 0) {
		download.error = "URL not starting with 'http'";
	}
	
}

function download (node, download, next) {

	checkUrl(download);
	if(download.error)
		return next();

	if(download.filename == "") {
		download.error("no file name");
		return next();
	}
		
	var filePath = path.join(node.dir, download.filename); 
	var file = fs.createWriteStream(filePath);

	var sendReq = request.get(download.url);

	// verify response code
	sendReq.on('response', function(response) {
		download.response = response;
		
		if(response.statusCode === 200) {
			
			sendReq.pipe(file);

			file.on('finish', function() {
				file.close(function () {
					counter++;
					next(sandbox);
				}); 
			});

			file.on('error', function(err) { 
				fs.unlink(filePath); // Delete the file async. 
				console.log(err);
				download.error = err;
				return next(sandbox);
			});
			
		} else {
		   download.error = "file not found on server!";
		   return next(sandbox);
		}

	});

	// check for request errors
	sendReq.on('error', function (err) {
		fs.unlink(filePath);
		console.log(err);
		download.error = err;
		return next(sandbox);

	});
	
}
