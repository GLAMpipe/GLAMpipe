var cron		= require('node-cron');

var exports = module.exports = {};

exports.init = async function() {
	var result = await global.db.collection("gp_cron").find();
	cron.schedule('* * * * *', () => {
	  console.log("Hi, I'm GLAMpipe cron " + new Date());
	});
}

exports.createNodeJob = async function (node, crontime, settings) {	
	console.log("Creating cron")
	if(cron.validate(crontime)) {
		await db.collection("gp_cron").insert({"node": node, "crontime": crontime, "settings": settings});
		return {node: node, cron: cron, settings: settings}
	} else {
		throw("Invalid cron expression")
	}
}

exports.getNodeJob = async function (node) {	
	console.log("Fetching cron for node: " + node)
	var jobs = await db.collection("gp_cron").find({"node": node});
	return jobs;
}

exports.getJobs = async function () {	
	console.log("Fetching crons")
	var jobs = await db.collection("gp_cron").find({});
	return jobs;
}
