
module.exports.initDBConnect = function () {

	// default 'localhost' configuration:
	var connection_string = '127.0.0.1:27017/glampipe';

	if (process.env.DOCKER)  {
		connection_string = "glampipe_mongo:27017/glampipe"

	}
	
	console.log("MongoDB connection: ", connection_string);

	return connection_string;
}


