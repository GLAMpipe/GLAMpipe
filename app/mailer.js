var mongojs 	= require('mongojs');
var mongoquery	= require("../app/mongo-query.js");
var async 		= require("async");
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');



exports.emailNodeRun = function(node, sandbox) {


	if(node.req && node.req.params.doc) {
		console.log("EMAIL: single doc (" + node.req.params.doc + ")");
		var query = {"_id" : mongojs.ObjectId(node.req.params.doc)};

		mongoquery.findOne(query, node.collection, function (err, doc) {
			//if(err || !doc)
			sandbox.context.doc = doc;
			sandbox.pre_run.runInContext(sandbox);
			
			if(sandbox.out.pre_value) {
				exports.sendMail(sandbox.out.pre_value, function(err, info) {
					sandbox.context.data = info;
					sandbox.run.runInContext(sandbox);
						
					var updateDoc = {$set: sandbox.out.setter};
					mongoquery.update(node.collection, {_id:sandbox.context.doc._id}, updateDoc, function(err, result) {
							sandbox.finish.runInContext(sandbox);
					});
				})
			} else {
				console.log("skipped");
				sandbox.finish.runInContext(sandbox);
			}
		})
	}
}

exports.sendMail = function(data, cb) {
console.log(data);

	if(!global.config.smtp || !global.config.smtpSender)
		return cb("SMTP not configured!");

	if(!data.to || !data.subject || !data.text) {
		return cb("You must set 'to', 'subject' and 'text'!");
	}
	var transporter = nodemailer.createTransport(smtpTransport({
		host: global.config.smtp
	}));
	
	// add html if provided
	if(data.html)
		data.html = req.body.html;
	
	//transporter.sendMail(data, function(err, info) {
		//cb(err, info);
	//});
	cb(null,{sdf:"sdf"})
}




exports.sendMailRest = function(req, res) {

	if(!global.config.smtp || !global.config.smtpSender)
		return res.json({error: "SMTP not configured!"});

	if(!req.body.to || !req.body.subject || !req.body.text) {
		return res.json({error: "You must set 'to', 'subject' and 'text'!"});
	}

	var transporter = nodemailer.createTransport(smtpTransport({
		host: global.config.smtp
	}));


	var data = {
	   from: global.config.smtpSender,
	   to: req.body.to,
	   subject: req.body.subject,
	   text: req.body.text
	}
	
	// add html if provided
	if(req.body.html)
		data.html = req.body.html;
	
	transporter.sendMail(data, function(err, info) {
		res.json(data);
	});

}






