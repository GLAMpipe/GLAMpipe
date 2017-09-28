var mongojs 	= require('mongojs');
var async 		= require("async");
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');



exports.sendMail = function(data, cb) {

	if(!global.config.smtp || !global.config.smtpSender)
		return cb("SMTP not configured!");

	if(!data.to || !data.subject || !data.text) {
		return cb("You must set 'to', 'subject' and 'text'!");
	}

	var transporter = nodemailer.createTransport(smtpTransport({
		service: global.config.smtp
	}));
	
	// add html if provided
	if(data.html)
		data.html = req.body.html;
	
	transporter.sendMail(data, function(err, info) {
		console.log(err);
		console.log(info);
		cb(err, info);
	});
}




exports.sendMailRest = function(req, res) {

	if(!global.config.smtp || !global.config.smtpSender)
		return res.json({error: "SMTP not configured!"});

	if(!req.body.to || !req.body.subject || !req.body.text) {
		return res.json({error: "You must set 'to', 'subject' and 'text'!"});
	}

	var transporter = nodemailer.createTransport(smtpTransport({
		service: global.config.smtp
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
		console.log(err);
		console.log(info);
		res.json(data);
	});

}






