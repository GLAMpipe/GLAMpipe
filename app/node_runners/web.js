var request = require("request");
var path    = require("path");

var exports = module.exports = {};


exports.postJSON = function (doc, sandbox, next) {
	
	console.log("WEB: POST JSON request");
	
	// let node create an upload JSON
	sandbox.pre_run.runInContext(sandbox);
	var options = sandbox.out.pre_value; 
	console.log(JSON.stringify(sandbox.out.pre_value, null, 4));

	if(!options.url || sandbox.context.skip)
		return next("skipping...")
	
	//require('request').debug = true;
	function responseCallback(error, response, body) {
		sandbox.context.data = body;
		sandbox.context.response = response;
		if (error) {
			console.log(error);
			next();
		} else {
			console.log(options.url);
			console.log("update response code:", response.statusCode);
			console.log("update body:", body);
			sandbox.run.runInContext(sandbox);
			next();
		}
	}

	// make actual HTTP request
	if(options.method === "put")
		request.put(options, responseCallback);
	else
		request.post(options, responseCallback);
}

// get JSON response via GET or POST
exports.fetchJSON = function (options, sandbox, next) {

	if(!options.url || sandbox.context.skip) {
		return next("skipping...");
	}
	
	//options.url =  "https://tools.wmflabs.org/openrefine-wikidata/en/api?query={%22query%22:%22Jyv%C3%A4skyl%C3%A4n%20yliopisto%22}";
	console.log("REQUEST:", options.url);

	// make actual HTTP request
	function responseCallback (error, response, body) {
		sandbox.context.response = response;
		console.log("RESPONSE: " + response.statusCode)
		if (error) {
			console.log(error);
			next();
		} else if (response.statusCode == 200) {
			try {
				sandbox.context.data = JSON.parse(body);
				//console.log("BODY:", body);
			} catch(e) {
				console.log("JSON PARSE:" + e.message);
				sandbox.context.error = "error JSON parse error";
			}
			next();
		} else {
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
		return next("WEB: missing url! skipping...")
		
	// make actual HTTP request
	function responseCallback (error, response, body) {
		sandbox.context.response = response;
		if (error) {
			console.log(error);
			sandbox.context.error = error;
			next();
		} else {
			sandbox.context.data = body;
			//console.log("update response:", body);
			next();
		} 
	}

    request.get(options, responseCallback); // default method is GET
}



exports.headRequest = function(options, sandbox, next) {

	console.log("REQUEST:", options.url);
	if(!options.url)
		return next("WEB: missing url! skipping...")

	request(options, function (error, response, body) {
		sandbox.context.data = {"error": error, "response": response};
		next({"error": error, "response": response});
	});

}



// this is meant to be called from asyncLoop.fieldLoop
exports.uploadFile = function (upload, sandbox, next ) {

	//sandbox.context.doc = doc;
	console.log("upload file");

	if(!upload)
		return next("no upload object from node!");

	console.log(JSON.stringify(upload, null, 4));

	// skip if file does not exist
	try {
		var stats = fs.statSync(upload.file);
	}
	catch(err) {
		console.log("WARNING: " + upload.file + " not found")
		return next("file does not exist");
	}

	// create form data and set file reading stream
	var formData = {
		data:JSON.stringify(upload.data)
	};
	formData[upload.upload_field] = fs.createReadStream(upload.file)
	//console.log(JSON.stringify(formData, null, 4));
	
	// make POST request 
	request.post({url:upload.url, formData: formData}, function(err, response, body) {
		sandbox.context.response = response;
		if (err) {
			console.error('upload failed:', err);
			console.log(body);
			sandbox.context.error = err;
			sandbox.run.runInContext(sandbox);
			next();
		} else {
			console.log('WEB: Upload successful!  Server responded with:', body);
			sandbox.context.data = body;
			sandbox.run.runInContext(sandbox);
			next();
		}
	});

}

// this is meant to be called from asyncLoop.fieldLoop
exports.uploadFile2 = function (upload, sandbox, next ) {

	sandbox.context.response = null;

	// skip if retrieve link already exists
	if(upload.link) {
		console.log("WEB: existing retrieve link, skipping upload")
		sandbox.context.data = {"existing_link": upload.link};
		sandbox.run.runInContext(sandbox);
		return next("file already uploaded");
	}

	var req = 	request.post(upload.options, function optionalCallback(err, response, body) {

		sandbox.context.response = response;

		if (err) {
			return console.error('upload failed:', err);
		} else if (response.statusCode === 200) {
			console.log('WEB: Upload successful!  Server responded with:', response.statusCode);
			sandbox.context.data = JSON.parse(body);
			next();
		} else {
			console.log('WEB: Upload failed!  Server responded with:', response.statusCode);
			console.log('body:', body);
			next();
		}
	});
	

	file_stream = fs.createReadStream(upload.file);
	file_stream.on('data', function(chunk) {
		console.log("WEB: reading..." + chunk.length);
		//size += chunk.length;
	});

	// if there is no file, write error to document
	file_stream.on('error', function() {
		console.log("WEB: file is NOT THERE");	
		sandbox.context.error = {type:"error", msg:"FILE not found", file:upload};
		return next();	
	});
	
	file_stream.on('end', function() {
		console.log("WEB: file is read");	
		//console.log(size);	
		//console.log((size/1000).toFixed(2));	
	});
	
	file_stream.pipe(req);

}


exports.downloadFile = function (download, sandbox, next ) {
	
	var fs = require("fs");
	
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
		download.error = "WEB: Invalid URL!"
		return next();
	}

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
					if(!download.filetype)
						console.log("WEB: no filetype detected!");
					else
						console.log("WEB: " + JSON.stringify(download.filetype));
					
					// add extension to file name if user requested it
					if(addext && download.filetype && download.filetype.ext) {
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


/**
 * Handle cookie login
 */
exports.cookieLogin = function (node, sandbox, cb) {

	// ask login details from node
	try {
		sandbox.login.runInContext(sandbox);
	} catch(e) {
		console.log(e);
		sandbox.out.error = "errorin in login.js:" + e.message;
		cb(e.message);
		return;
	}
	console.log("WEB: login url:" , sandbox.out.login.url);

	
	// send login information
	request.post(sandbox.out.login, function(error, response, body) {
		
		if(error)
			cb("Login error")
		else if(response.statusCode === 200) {
			sandbox.out.say("progress", "Login successful"); 
			cb(null);
		} else
			cb("Authentication failed");

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
