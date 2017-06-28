var request = require("request");
var path    = require("path");

var exports = module.exports = {};


exports.postJSON = function (doc, sandbox, next) {
	
	console.log("POST JSON request");
	
	// let node create an upload JSON
	sandbox.pre_run.runInContext(sandbox);
	var options = sandbox.out.pre_value; 
	console.log(JSON.stringify(sandbox.out.pre_value, null, 4));

	if(!options.url)
		return next("missing url! skipping...")
	
	//require('request').debug = true;

	// make actual HTTP request
	request.post(options, function (error, response, body) {
		sandbox.context.data = body;
		if (error) {
			console.log(error);
			next();
		} else {
			console.log(options.url);
			console.log("update response:", body);
			sandbox.run.runInContext(sandbox);
			next();
		}
	});
}

// get JSON response via GET or POST
exports.fetchJSON = function (options, sandbox, next) {

	if(!options.url) {
		return next("missing url! skipping...");
	}

	console.log("REQUEST:", options.url);

	// make actual HTTP request
	function responseCallback (error, response, body) {
		if (error) {
			console.log(error);
			next();
		} else if (response.statusCode == 200) {
			sandbox.context.data = JSON.parse(body);
			//console.log("update response:", body);
			next();
		} else {
			console.log("SERVER RESPONSE: " + response.statusCode)
			next();
		}
	}
	if(sandbox.out.method === "post")
		request.post(options, responseCallback);
	else
		request.get(options, responseCallback); // default method is GET
}


exports.fetchContent = function (options, sandbox, next) {
	
	if(!options.url)
		return next("missing url! skipping...")
		
	// make actual HTTP request
	function responseCallback (error, response, body) {
		if (error) {
			console.log(error);
			next();
		} else {
			sandbox.context.data = body;
			sandbox.context.response = response;
			//console.log("update response:", body);
			next();
		} 
	}

    request.get(options, responseCallback); // default method is GET
}



exports.headRequest = function(options, sandbox, next) {

	var request = require("request");
	console.log("REQUEST:", options.url);
	if(!options.url)
		return next("missing url! skipping...")

	request(options, function (error, response, body) {
		sandbox.context.data = {"error": error, "response": response};
		next({"error": error, "response": response});
	});

}



// this is meant to be called from asyncLoop.fieldLoop
exports.uploadFile = function (doc, sandbox, next ) {

	//sandbox.context.doc = doc;
	console.log("upload file");

	if(!sandbox.out.pre_value)
		return next("no upload object from node!");

	var options = doc;
	console.log(JSON.stringify(options, null, 4));

	// skip if file does not exist
	try {
		var stats = fs.statSync(options.file);
	}
	catch(err) {
		console.log("WARNING: " + options.file + " not found")
		return next("file does not exist");
	}

	// create form data and set file reading stream
	var formData = {
		data:JSON.stringify(options.data)
	};
	formData[options.upload_field] = fs.createReadStream(options.file)
	//console.log(JSON.stringify(formData, null, 4));
	
	// make POST request 
	request.post({url:options.url, formData: formData}, function(err, response, body) {
		if (err) {
			console.error('upload failed:', err);
			console.log(body);
			sandbox.context.error = err;
			sandbox.run.runInContext(sandbox);
			next();
		} else {
			console.log('Upload successful!  Server responded with:', body);
			sandbox.context.response = response;
			sandbox.context.data = body;
			sandbox.run.runInContext(sandbox);
			next();
		}
	});

}


exports.downloadFile = function (download, sandbox, next ) {
	
	var fs = require("fs");
	var request = require("request");
	
	var node = sandbox.context.node;
	sandbox.context.data = download;
	
	// dry run
	if(node.settings.dry_run) {
		checkUrl(download);
		next();
	
	// actual run
	} else {
		fileExists(node, download, function(error, filePath) {
			
			if(error == null) {
				console.log("FILENAME:", download.filename);
				console.log("REQUEST:", download.url);
				exports.downloadAndSave(node, download, sandbox.context.node.settings.extension, next);

			} else {
				// file exist -> write file path to
				download.error = error;
				download.filepath = filePath;
				sandbox.context.data = download;
				next();
			}
		});			
	}

}


exports.downloadAndSave = function (node, download, addext, next) {

	const readChunk = require('read-chunk');
	const fileType = require('file-type');

	if(isInvalidURL(download.url)) {
		download.error = "Invalid URL!"
		return next();
	}

	var request = require("request");
	
	var filePath = path.join(node.dir, download.filename); 
	var file = fs.createWriteStream(filePath);
	
	var options = {
		url:download.url,
		followRedirect:false
	}
	
	// use basic authentication if node did set "auth"
	if(download.auth)
		options.auth = download.auth;
	
	var sendReq = request.get(options);

	// verify response code
	sendReq.on('response', function(response) {
		
		download.response = response;
		
		if(response.statusCode === 200) {
			
			sendReq.pipe(file);

			file.on('finish', function() {
				file.close(function () {
					const buffer = readChunk.sync(filePath, 0, 4100);
					download.filetype = fileType(buffer);
					
					// add extension to file name if user requested it
					if(addext && download.filetype.ext) {
						download.filename = download.filename + "." + download.filetype.ext;
						fs.rename(filePath, filePath + "." + download.filetype.ext, function(err) {
							if ( err ) console.log('ERROR: ' + err);
							next();
						});
					} else {
						next();
					}
				}); 
			});

			file.on('error', function(err) { 
				fs.unlink(filePath); // Delete the file async. 
				console.log(err);
				download.error = err;
				return next();
			});
			
		} else {
			fs.unlink(filePath);
			download.error = "file not found on server!";
			console.log("file not found on server!");
			return next();
		}

	});

	// check for request errors
	sendReq.on('error', function (err) {
		console.log("CONNECTION ERROR");
		fs.unlink(filePath);
		console.log(err);
		download.error = err;
		return next();

	});
	
}


function fileExists (node, download, cb) {

	if(download.filename == "") {
		return cb("no file name");
	}

	// if node has downloaded file earlier, then check if that file exists
	if(download.previous)
		var filePath = download.previous;
	else
		var filePath = path.join(node.dir, download.filename);

	fs.stat(filePath, function(err, stat) {
		if(err == null) {
			console.log("FILE EXISTS:", filePath);
			cb("file exists", filePath);
		} else if(err.code == 'ENOENT') {
			cb(null, filePath)
		} else {
			console.log('Error with file stats: ', err.code);
			cb(err.code);
		}
	});
}


function isInvalidURL(url) {
	
	if(url == null || url == "") {
		return "URL missing";
	} else if(url.search("http") != 0) {
		return "URL not starting with 'http'";
	} else
		return false;
	
}
