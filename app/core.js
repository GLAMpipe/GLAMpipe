var path 		= require("path");
const vm 		= require('vm');
var mongoquery 	= require("../app/mongo-query.js");
var buildquery 	= require("../app/query-builder.js");
const MP 		= require("../config/const.js");
var exports 	= module.exports = {};



/**
 * Create glampipe collection on start up
 * - "glampipe" is only collection that must exist
 * - makes sure that "project_count" exists
 */
exports.initDB = function (callback) {
	mongoquery.findOne({},"mp_settings", function(err, data) { 
		if(err) {
			console.log("INITDB failed!");
			callback(err);
		} else {
			if(data) {
				console.log("DB: mp_settings exists");
				callback();
			} else {
				console.log("DB: creating project counter");
				mongoquery.insert("mp_settings", {"project_count":0, "data_path":""}, function(error, result) {
					if(error) {
						console.log("ERROR: could not create project counter!");
						callback(result.error);
					}
					else 
						callback();
				});
			}
		}
	});
}

exports.createDirIfNotExist = function (dataPath, callback) {
	fs = require('fs');
	
	// create "projects" directory
	fs.mkdir(dataPath, function(err) {
		if(err) {
			if (err.code === "ENOENT") {
				return callback(err, "directory does not exist!\n" + dataPath);
				
			} else if(err.code === "EEXIST") {
				return callback();
				
			} else
				return callback(err, err.message);
				
		}
		console.log("INIT: " + dataPath + " directory created");
		callback();
	});
			

}



exports.sendErrorPage = function (res, error) {
	fs = require('fs');
	fs.readFile(path.join(__dirname, "views", "setup.html"), 'utf-8', function(err, content) {
		if (err) {
			console.log(err);
			res.send(err);
		} else {
			// write error inside a script tag
			if(error) {
				content = content.replace("[[initerror]]", "<script>var error = " + JSON.stringify(error) + "</script>");
			} else {
				content = content.replace("[[initerror]]", "<script>var error = {status:'ok',datapath:'"+global.config.dataPath+"'}</script>");
			}
			res.send(content);
		}
	});
}


exports.setDataPath = function (params, glampipe, res) {
	var dataPath = params.datapath;
	mongoquery.update("mp_settings",{}, {$set: {data_path: dataPath}}, function(error) {
		if(error) {
			console.log(error);
			glampipe.io.sockets.emit("error", "could not save datapath");
			res.json({"error":"could not save datapath"});
		} else {
			glampipe.initError = {status: "ok"};
			global.config.dataPath = dataPath;
			global.config.projectsPath = path.join(dataPath, "projects");
			console.log("datapath set to:", dataPath );
			glampipe.io.sockets.emit("progress", "datapath set to: " + dataPath);
			res.json({"status": "ok","datapath": dataPath});
		}
	})
};


exports.runProject = function (req, gp, res) {
	var projectId = req.params.id;

	var project	= require("../app/project.js");
	project.run(req.params.id, gp, function(data) {
		res.json(data);
	});


}



exports.uploadFile = function (req, res ) {
	
	console.log("req.file:", req.file);
	if(req.file.mimetype) {
		return res.json({
			"status": "ok",
			filename:req.file.filename,
			mimetype:req.file.mimetype,
			title: req.body.title,
			nodeid: req.body.nodeid,
			project: req.body.project,
			description: req.body.description
		})
	} else {
		return res.json({
			"status": "ok",
			filename:req.file.filename,
			mimetype:"unknown",
			title: req.body.title,
			nodeid: req.body.nodeid,
			project: req.body.project,
			description: req.body.description
		})
	}
}

exports.deleteFile = function(req, res) {
	var file_id = path.normalize(req.params.id).replace(/^(\.\.[\/\\])+/, '');
	var file = path.join(global.config.dataPath, 'tmp', file_id);
	fs.unlink(file, function(err) {
		if(err)
			res.json({status: "error", file:req.params.id});
		else
			res.json({status:"ok", file:req.params.id});
	})
}





exports.readDir = function (dirname, onFileList, onError) {
	var fs = require("fs");
	fs.readdir(dirname, function(err, filenames) {
		if (err) {
			onError(err);
			return;
		}
		onFileList(filenames);
	});
}





function fileStats (sandbox, node, onScript, onError) {
	fs.stat(sandbox.out.pre_value, function (err, stats) {
		if(err)
			onError(err);
			
		sandbox.context.filestats = stats;
		onScript(sandbox);
	});
}


