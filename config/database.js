
module.exports.initDBConnect = function () {

	// default 'localhost' configuration:
	var connection_string = '127.0.0.1:27017/glampipe';

	// this allows linking of mongo container (kontena.yaml)
	if(process.env.MONGO_PORT) {
		console.log(process.env.MONGO_NAME);
		connection_string = process.env.MONGO_PORT_27017_TCP_ADDR + ':' +
		process.env.MONGO_PORT_27017_TCP_PORT + '/' + 'glampipe';
	}

	if (process.env.DOCKER)  {
		connection_string = "glampipe_mongo:27017/glampipe"

	}
	
	console.log("MongoDB connection: ", connection_string);

	return connection_string;
}


